import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Zap, AlertTriangle, CheckCircle, Battery, Activity, Power, Clock, StopCircle, PlayCircle, Square, Loader2, SquareX } from 'lucide-react';
import confetti from 'canvas-confetti';

const ChargingLive = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [errorToast, setErrorToast] = useState('');

  // Summary shown after manual stop
  const [stoppedSummary, setStoppedSummary] = useState(null);
  
  // Local timer state
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}/status`);
      if (res.data.success) {
        setSession(prev => {
          // If first load and active, initialize local timer
          if (!prev && res.data.remainingTimeMinutes) {
            setRemainingSeconds(Math.max(0, res.data.remainingTimeMinutes * 60));
          } else if (res.data.status === 'completed') {
            setRemainingSeconds(0);
          }
          return res.data;
        });
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchStatus();
    pollIntervalRef.current = setInterval(fetchStatus, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId]);

  // Local tick for timer
  useEffect(() => {
    if (session?.status === 'active' || session?.status === 'charging') {
      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [session?.status]);

  // Prevent Navigation while charging
  useEffect(() => {
    const isCharging = session?.status === 'active' || session?.status === 'charging';
    
    const handleBeforeUnload = (e) => {
      if (isCharging) {
        e.preventDefault();
        e.returnValue = 'Charging is in progress. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session?.status]);

  useEffect(() => {
    if (session?.status === 'completed' && !hasCelebrated) {
      fireConfetti();
      setHasCelebrated(true);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [session?.status, hasCelebrated]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2DD4BF', '#4ADE80', '#FCD34D']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2DD4BF', '#4ADE80', '#FCD34D']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/sessions/${sessionId}/stop`);
      if (res.data.success) {
        // Stop all polling + timers — session is now frozen
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        setShowStopConfirm(false);
        setStoppedSummary(res.data.summary);

        // Re-fetch one last time to lock ring/stats at final values
        await fetchStatus();
      } else {
        throw new Error(res.data.error || 'Stop failed');
      }
    } catch (err) {
      console.error('Failed to stop charging:', err);
      showError('Failed to stop charging — please try again.');
      // Keep modal open so user can retry
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/sessions/${sessionId}/resume`);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to resume charging:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '0 mins';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} mins`;
    return `${mins} mins`;
  };

  if (loading) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[80vh]">
        <div style={{ color: 'var(--text-muted)' }}>Connecting to charger...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[80vh]">
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-light)' }}>Session Not Found</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/charge')}>Go Back</button>
      </div>
    );
  }

  const isCharging = session.status === 'active' || session.status === 'charging';
  // DB CHECK constraint only allows: 'active' | 'completed' | 'interrupted'
  // A manual stop stores status='interrupted', interrupted_reason='manual_stop'
  const isInterrupted = session.status === 'interrupted';
  const isManualStop = isInterrupted && session.interruptedReason === 'manual_stop';
  const isCompleted = session.status === 'completed';
  // After a manual stop, stoppedSummary is set and we freeze the view
  const isStopped = !!stoppedSummary;

  const progressPercentage = Math.min(100, Math.max(0, (session.energyDeliveredKwh / session.targetEnergyKwh) * 100));
  
  // SVG Ring calculation
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', paddingBottom: '6rem' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {/* Session Info Strip */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '2rem'
      }}>
        <span>ID: {sessionId.substring(0,8)}</span>
        <span>Target: {session.targetEnergyKwh} kWh</span>
      </div>

      {/* Main Animation Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        
        {/* Rotating Sci-Fi Glow (only while live charging) */}
        {isCharging && !isStopped && (
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)',
            animation: 'rotate-glow 8s linear infinite',
            zIndex: 0
          }}></div>
        )}

        <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
            {/* Background Ring */}
            <circle cx="125" cy="125" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
            {/* Progress Ring */}
            <circle
              cx="125" cy="125" r={radius} fill="transparent"
              stroke={isStopped ? '#F59E0B' : isInterrupted ? '#F87171' : isCompleted ? '#FBBF24' : "url(#ringGradient)"}
              strokeWidth="16"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          
          {/* Inner Content */}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isStopped ? (
              <SquareX size={32} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
            ) : isInterrupted ? (
              <AlertTriangle size={32} color="#F87171" style={{ marginBottom: '0.5rem' }} />
            ) : isCompleted ? (
              <CheckCircle size={32} color="#FBBF24" style={{ marginBottom: '0.5rem' }} />
            ) : (
              <Zap size={32} color="#4ADE80" style={{ animation: 'pulse-glow 1.5s infinite', marginBottom: '0.5rem' }} />
            )}
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-light)', lineHeight: '1' }}>
              {Math.floor(progressPercentage)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {isStopped ? 'Stopped' : isCompleted ? 'Complete' : isInterrupted ? 'Interrupted' : 'Charging...'}
            </div>
          </div>
        </div>
      </div>

      {/* Interruption Banner (only if interrupted without summary) */}
      {isInterrupted && !isStopped && (
        <div style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h4 style={{ color: '#F87171', margin: '0 0 0.5rem 0' }}>⚠️ Charging Stopped</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0 }}>
            Reason: {session.interruptedReason === 'manual_stop' ? 'Stopped by user' : (session.interruptedReason || 'Unknown error')}
          </p>
        </div>
      )}

      {/* STATS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Row 1 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ flex: 1, padding: '1rem', margin: 0, borderLeft: '4px solid #2DD4BF', backgroundColor: '#131B2E', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚡ Live Voltage</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2DD4BF', transition: 'all 0.3s' }}>
              {session.voltage.toFixed(1)} V
            </div>
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem', margin: 0, borderLeft: '4px solid #4ADE80', backgroundColor: '#131B2E', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>〜 Live Current</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ADE80', transition: 'all 0.3s' }}>
              {session.current.toFixed(1)} A
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ flex: 1, padding: '1rem', margin: 0, borderLeft: '4px solid #F59E0B', backgroundColor: '#131B2E', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💡 Live Power</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#F59E0B', transition: 'all 0.3s' }}>
              {session.power.toFixed(2)} kW
            </div>
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem', margin: 0, borderLeft: '4px solid #3B82F6', backgroundColor: '#131B2E', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔋 Energy Delivered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3B82F6', transition: 'all 0.3s' }}>
              {session.energyDeliveredKwh.toFixed(2)} kWh
            </div>
          </div>
        </div>

        {/* Row 3 - Progress Bar */}
        <div className="card" style={{ padding: '1rem', margin: 0, backgroundColor: '#131B2E', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Energy Progress</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 'bold' }}>
              {session.energyDeliveredKwh.toFixed(2)} / {session.targetEnergyKwh.toFixed(2)} kWh
            </span>
          </div>
          <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0,
              width: `${progressPercentage}%`, 
              height: '100%', 
              background: isStopped ? '#F59E0B' : isInterrupted ? '#F87171' : isCompleted ? '#FBBF24' : 'linear-gradient(90deg, #2DD4BF, #4ADE80)',
              transition: 'width 1s linear',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {isCharging && !isStopped && <div className="energy-shimmer"></div>}
            </div>
          </div>
        </div>

        {/* Row 4 - Info Chips */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Est. Remaining</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
                {isCompleted || isStopped ? '0 mins' : formatTime(remainingSeconds)}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>💰</span>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cost So Far</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
                ₹{session.costSoFar}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── STOPPED SUMMARY CARD ── */}
      {(isStopped || isCompleted || isManualStop) && (
        <div style={{
          backgroundColor: '#1A1500',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SquareX size={22} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#F59E0B', fontSize: '1.1rem', fontWeight: 700 }}>
                {isCompleted ? '✅ Charging Complete' : '⏹ Charging Stopped'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Session has ended — summary below</p>
            </div>
          </div>

          {/* Summary rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Energy Delivered', value: `${(stoppedSummary?.energyDeliveredKwh || session.energyDeliveredKwh || 0).toFixed(2)} kWh`, color: '#3B82F6' },
              { label: 'Amount Charged', value: `₹${(stoppedSummary?.finalCost || parseFloat(session.costSoFar) || 0).toFixed(2)}`, color: 'var(--text-light)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            ))}

            {stoppedSummary && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Duration</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-light)' }}>
                    {stoppedSummary.durationMinutes} min{stoppedSummary.durationMinutes !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Amount Paid (Upfront)</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    ₹{stoppedSummary.amountPaid.toFixed(2)}
                  </span>
                </div>

                {/* Refund row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Refund Amount</span>
                  {stoppedSummary.refundAmount > 0 ? (
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4ADE80' }}>
                      ₹{stoppedSummary.refundAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No refund due</span>
                  )}
                </div>

                {/* Refund status chip */}
                {stoppedSummary.refundAmount > 0 && (
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(74, 222, 128, 0.07)',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    color: '#4ADE80',
                  }}>
                    ✅ Refund Processing — usually takes 5–7 business days
                  </div>
                )}
              </>
            )}
          </div>

          {/* Back to Home button */}
          <button
            className="btn"
            style={{
              marginTop: '1.5rem',
              width: '100%',
              backgroundColor: '#2DD4BF',
              color: '#000',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.9rem',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/charge')}
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Action Buttons (only when NOT showing stopped summary) */}
      {!(isStopped || isCompleted || isManualStop) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '1rem', backgroundColor: 'var(--bg-dark)', zIndex: 100, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'center' }}>
            {isCharging && (
              <button 
                className="btn" 
                style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', padding: '1rem', borderRadius: '12px' }}
                onClick={() => setShowStopConfirm(true)}
                disabled={actionLoading}
              >
                <Square fill="currentColor" size={16} />
                Stop Charging
              </button>
            )}

            {isInterrupted && !isManualStop && (
              <button 
                className="btn" 
                style={{ width: '100%', backgroundColor: '#4ADE80', color: '#000', fontSize: '1.1rem', padding: '1rem' }}
                onClick={handleResume}
                disabled={actionLoading}
              >
                <PlayCircle size={20} />
                Resume Charging
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', backgroundColor: '#131B2E', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={32} color="#F59E0B" />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-light)', fontSize: '1.5rem' }}>Stop Charging?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                Your charging session will end. Any unused balance will be refunded automatically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                <button 
                  className="btn" 
                  style={{ width: '100%', backgroundColor: '#F87171', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: actionLoading ? 0.7 : 1 }}
                  onClick={handleStop}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Stopping...</>
                    : 'Yes, Stop Charging'
                  }
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', borderRadius: '12px', border: 'none', color: 'var(--text-muted)' }}
                  onClick={() => setShowStopConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1F1010', border: '1px solid #F87171',
          borderRadius: '12px', padding: '0.9rem 1.4rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 2000,
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          <AlertTriangle size={18} color="#F87171" />
          <span style={{ color: '#F87171', fontWeight: 500, fontSize: '0.9rem' }}>{errorToast}</span>
        </div>
      )}
    </div>
  );
};

export default ChargingLive;
