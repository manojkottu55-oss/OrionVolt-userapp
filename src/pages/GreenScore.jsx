import React, { useState, useEffect } from 'react';
import { Leaf, Gift, ArrowRight, Zap, Target, TrendingUp, CheckCircle, Calendar, Sparkles } from 'lucide-react';

const mockTimeline = [
  { id: 1, date: 'Oct 15, 2026 - 10:30 AM', kiosk: 'KS002', energy: '1.2 kWh', score: 27 },
  { id: 2, date: 'Oct 12, 2026 - 4:15 PM', kiosk: 'KS005', energy: '0.8 kWh', score: 26 },
  { id: 3, date: 'Oct 09, 2026 - 9:00 AM', kiosk: 'KS001', energy: '2.5 kWh', score: 25 },
  { id: 4, date: 'Oct 05, 2026 - 6:45 PM', kiosk: 'KS003', energy: '1.0 kWh', score: 24 },
  { id: 5, date: 'Oct 01, 2026 - 2:20 PM', kiosk: 'KS004', energy: '1.5 kWh', score: 23 },
];

const GreenScore = () => {
  const [totalPoints] = useState(27);
  const [pointsRedeemed] = useState(9);
  const availablePoints = totalPoints - pointsRedeemed;
  
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [toast, setToast] = useState(false);
  
  // Leaderboard counters
  const [globalPoints, setGlobalPoints] = useState(0);
  const [co2Saved, setCo2Saved] = useState(0);

  useEffect(() => {
    // Simple count up animation for leaderboard
    let start = 0;
    const endPoints = 12430;
    const endCo2 = 284;
    const duration = 2000;
    const interval = 20;
    const steps = duration / interval;
    const pointStep = endPoints / steps;
    const co2Step = endCo2 / steps;

    const timer = setInterval(() => {
      start++;
      if (start <= steps) {
        setGlobalPoints(Math.floor(start * pointStep));
        setCo2Saved(Math.floor(start * co2Step));
      } else {
        clearInterval(timer);
        setGlobalPoints(endPoints);
        setCo2Saved(endCo2);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleRedeem = () => {
    if (redeemInput > 0 && redeemInput <= availablePoints) {
      setIsRedeemModalOpen(false);
      
      // Trigger confetti on body
      document.body.classList.add('show-confetti');
      setToast(true);
      
      setTimeout(() => {
        setToast(false);
        document.body.classList.remove('show-confetti');
      }, 4000);
    }
  };

  const discountValue = Math.floor((redeemInput || 0) / 3);
  const nextRewardProgress = (availablePoints % 3) / 3 * 100;
  const pointsToNext = 3 - (availablePoints % 3);

  // Circular Progress calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Let's make the progress ring visually represent points out of e.g. 30 (just for visual filling)
  const visualMax = 30;
  const dashoffset = circumference - (Math.min(totalPoints, visualMax) / visualMax) * circumference;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Leaf size={32} color="var(--primary)" /> My Green Score
      </h1>

      {/* Top Section */}
      <div className="top-grid slide-up">
        {/* Hero Section */}
        <div className="card green-hero">
          <div className="score-ring-container">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e676" />
                  <stop offset="100%" stopColor="#00bcd4" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle 
                cx="80" cy="80" r={radius} fill="none" 
                stroke="url(#greenGradient)" 
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                className="score-ring-progress"
              />
            </svg>
            <div className="score-center">
              <span className="score-number">{totalPoints}</span>
              <span className="score-label">Green Points</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Next Reward: {pointsToNext} points to your next 1% discount</p>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${nextRewardProgress}%` }}></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--primary)', fontStyle: 'italic' }}>"Every charge makes the planet greener 🌱"</p>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="card breakdown-card">
          <div className="breakdown-stats">
            <div className="stat-col">
              <Target size={24} color="var(--text-muted)" />
              <div className="stat-val">{totalPoints}</div>
              <div className="stat-lbl">Total Earned</div>
            </div>
            <div className="stat-col">
              <TrendingUp size={24} color="var(--text-muted)" />
              <div className="stat-val">{pointsRedeemed}</div>
              <div className="stat-lbl">Points Redeemed</div>
            </div>
            <div className="stat-col highlight-col">
              <Gift size={24} color="var(--primary)" />
              <div className="stat-val">{availablePoints}</div>
              <div className="stat-lbl">Available ({Math.floor(availablePoints / 3)}% Off)</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setIsRedeemModalOpen(true)}>
            Redeem Now
          </button>
        </div>
      </div>

      {/* How it Works */}
      <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>How it Works</h2>
      <div className="how-it-works slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="step-card">
          <div className="step-icon"><Zap size={24} /></div>
          <p><strong>1. Charge</strong><br/>at any OrionVolt kiosk</p>
        </div>
        <ArrowRight className="step-arrow" color="var(--text-muted)" />
        <div className="step-card">
          <div className="step-icon"><Leaf size={24} /></div>
          <p><strong>2. Earn</strong><br/>+1 Green Point automatically</p>
        </div>
        <ArrowRight className="step-arrow" color="var(--text-muted)" />
        <div className="step-card">
          <div className="step-icon"><Gift size={24} /></div>
          <p><strong>3. Reward</strong><br/>Every 3 points = 1% free charging</p>
        </div>
      </div>

      {/* Timeline & Leaderboard Container */}
      <div className="dashboard-grid" style={{ marginTop: '3rem' }}>
        <div className="timeline-section slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>My Green Journey</h2>
          <div className="timeline">
            {mockTimeline.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-dot"></div>
                <div className="card timeline-card">
                  <div className="timeline-header">
                    <strong>{item.kiosk}</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+1 🌿</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{item.date}</div>
                  <div className="timeline-footer">
                    <span>{item.energy} delivered</span>
                    <span>Total: {item.score} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="leaderboard-section slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="card leaderboard-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Community Impact 🌍
            </h2>
            <div className="lb-stat">
              <span className="lb-val">{globalPoints.toLocaleString()}</span>
              <span className="lb-lbl">Total Green Points earned</span>
            </div>
            <div className="lb-stat">
              <span className="lb-val">{co2Saved} kg</span>
              <span className="lb-lbl">CO₂ saved this month</span>
            </div>
            <div className="lb-stat">
              <span className="lb-val" style={{ color: 'var(--primary)' }}>42%</span>
              <span className="lb-lbl">Greener than petrol riders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {isRedeemModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRedeemModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Redeem Green Score</h2>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{availablePoints}</div>
                <div style={{ color: 'var(--text-muted)' }}>Available Points</div>
              </div>
              
              <div className="input-group">
                <label className="input-label">How many points to redeem?</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={redeemInput} 
                  onChange={e => setRedeemInput(e.target.value)}
                  max={availablePoints}
                  min="3"
                  step="3"
                  placeholder="e.g. 3, 6, 9..."
                />
              </div>

              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'rgba(0, 230, 118, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                textAlign: 'center',
                marginTop: '1rem'
              }}>
                <Sparkles size={20} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                <div><strong>{redeemInput || 0} points</strong> = <strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{discountValue}% off</strong></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>your next charge</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsRedeemModalOpen(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleRedeem}
                disabled={!redeemInput || redeemInput < 3 || redeemInput > availablePoints}
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-notification">
          <CheckCircle size={20} color="var(--primary)" />
          Discount applied to your next charge! 🎉
        </div>
      )}

      {/* CSS Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseRing { 
          0% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.4); } 
          70% { box-shadow: 0 0 0 20px rgba(0, 230, 118, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); } 
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .slide-up {
          opacity: 0;
          animation: slideUp 0.6s ease-out forwards;
        }

        .green-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 2rem;
          background: radial-gradient(circle at center, rgba(0, 230, 118, 0.1) 0%, var(--card-bg) 60%);
          border: 1px solid rgba(0, 230, 118, 0.2);
        }

        .score-ring-container {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          animation: pulseRing 3s infinite;
        }
        
        .score-ring-progress {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dashoffset 1.5s ease-out;
        }

        .score-center {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-number {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(90deg, #00e676, #00bcd4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .score-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .progress-bar-bg {
          width: 100%;
          max-width: 300px;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          margin: 0 auto;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
          transition: width 1s ease-out;
        }

        .top-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .breakdown-card {
          border: 1px solid rgba(0, 230, 118, 0.3);
          box-shadow: 0 0 20px rgba(0, 230, 118, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .breakdown-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          text-align: center;
        }

        .stat-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
        }

        .highlight-col {
          background: rgba(0, 230, 118, 0.1);
          border: 1px solid rgba(0, 230, 118, 0.2);
        }

        .stat-val {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }

        .stat-lbl {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .how-it-works {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .step-card {
          flex: 1;
          background: var(--card-bg);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          background: rgba(0, 230, 118, 0.1);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
        }

        .step-card p { margin: 0; font-size: 0.9rem; color: var(--text-light); line-height: 1.4; }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .top-grid { grid-template-columns: 1fr; }
          .how-it-works { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); }
          .dashboard-grid { grid-template-columns: 1fr; }
          .breakdown-stats { grid-template-columns: 1fr; }
        }

        .timeline {
          position: relative;
          padding-left: 20px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(0, 230, 118, 0.3);
        }

        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .timeline-dot {
          position: absolute;
          left: -25px;
          top: 16px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 8px var(--primary);
        }

        .timeline-card {
          margin-bottom: 0;
          padding: 1rem 1.25rem;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .timeline-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          color: var(--text-light);
        }

        .leaderboard-card {
          border: 1px solid rgba(0, 230, 118, 0.3);
          box-shadow: 0 0 20px rgba(0, 230, 118, 0.05);
          position: sticky;
          top: 20px;
        }

        .lb-stat {
          display: flex;
          flex-direction: column;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .lb-stat:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .lb-val {
          font-size: 1.75rem;
          font-weight: 700;
          font-family: monospace;
          color: var(--text-light);
        }

        .lb-lbl {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        
        .toast-notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          padding: 1rem 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          color: var(--text-light);
          z-index: 2000;
          animation: slideIn 0.3s ease-out;
        }
        
        /* Confetti pseudo-element simulation for full screen */
        body.show-confetti::before, body.show-confetti::after {
          content: '🎉✨🎊';
          position: fixed;
          top: 10px;
          left: 50%;
          font-size: 3rem;
          animation: confettiFall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          z-index: 9999;
          pointer-events: none;
        }
        body.show-confetti::after {
          left: 40%;
          animation-delay: 0.2s;
          content: '🌿💚🌱';
        }
      `}} />
    </div>
  );
};

export default GreenScore;
