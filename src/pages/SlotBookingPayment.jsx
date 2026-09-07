import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, ChevronLeft, MapPin, Calendar, Clock,
  Zap, AlertTriangle, Copy, CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api';

const SlotBookingPayment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-filled from navigation state
  const preload = location.state || {};

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'success'
  const [accessCode, setAccessCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preload.totalPayable && preload.kioskLocation) {
      setBooking(preload);
      setLoading(false);
    } else {
      // Fetch booking details
      api.get(`/bookings/${bookingId}/access-code`).then(res => {
        if (res.data.success) {
          // If booking is already confirmed, show access code directly
          if (res.data.status === 'confirmed') {
            setAccessCode(res.data.accessCode);
            setStatus('success');
          }
          setBooking(res.data);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [bookingId]);

  const handlePaid = async () => {
    setVerifying(true);
    setError('');
    try {
      const res = await api.post(`/bookings/${bookingId}/confirm-payment`);
      if (res.data.success) {
        setAccessCode(res.data.accessCode);
        setStatus('success');
        fireConfetti();
      } else {
        setError('Payment confirmation failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment confirmation failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const fireConfetti = () => {
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00C853', '#4ADE80'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00C853', '#4ADE80'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short'
    });
  };

  const totalPayable = booking?.totalPayable || preload.totalPayable || 0;
  const upiUrl = `upi://pay?pa=orionvolt@axl&pn=OrionVolt&am=${totalPayable}&cu=INR&tn=EV+Slot+Booking`;

  if (loading) {
    return (
      <div className="page-content flex flex-col items-center justify-center">
        <div style={{ color: 'var(--text-muted)' }}>Loading booking details...</div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     SUCCESS: Show access code screen
  ═══════════════════════════════════════════════ */
  if (status === 'success') {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>

          {/* Success icon */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,200,83,0.15)', margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={40} color="#00C853" />
            </div>
          </div>

          <h2 style={{ color: '#00C853', margin: '0 0 0.5rem 0' }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Your slot is reserved. Enter the code below on the kiosk keypad when you arrive.
          </p>

          {/* Big access code */}
          <div style={{
            background: 'var(--card-bg)',
            border: '2px dashed #00C853',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Kiosk Access Code
            </div>
            <div style={{
              fontSize: '3.5rem', fontWeight: '900', letterSpacing: '0.5rem',
              color: '#00C853', fontFamily: 'monospace', lineHeight: 1
            }}>
              {accessCode}
            </div>
            <button
              onClick={handleCopyCode}
              style={{
                marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center',
                gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer',
                color: copied ? '#00C853' : 'var(--text-muted)', fontSize: '0.8rem'
              }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>

          {/* Booking details */}
          <div style={{
            background: 'var(--input-bg)', borderRadius: '12px',
            padding: '1rem', marginBottom: '1.5rem', textAlign: 'left'
          }}>
            {[
              { icon: <MapPin size={14} />, label: 'Kiosk', value: booking?.kioskLocation || preload.kioskLocation },
              { icon: <Calendar size={14} />, label: 'Slot from', value: formatTime(preload.arrivalTime || booking?.arrivalTime) },
              { icon: <Clock size={14} />, label: 'Slot until', value: formatTime(preload.slotEndTime || booking?.slotEndTime) },
              { icon: <Zap size={14} />, label: 'Energy target', value: `${preload.targetEnergyKwh || booking?.targetEnergyKwh || '—'} kWh` }
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* No-show warning */}
          <div style={{
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
            background: 'rgba(239,68,68,0.08)', borderRadius: '10px',
            padding: '0.75rem', marginBottom: '1.5rem', textAlign: 'left'
          }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
              <strong>No-show policy:</strong> The booking fee and energy payment are non-refundable if you do not use this slot.
            </p>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/slot-booking')}>
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     WAITING: Payment / QR screen
  ═══════════════════════════════════════════════ */
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/slot-booking')}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', color: 'var(--text)' }}>Pay &amp; Confirm</h2>
        <div style={{ width: 40 }} />
      </div>

      <div className="card" style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Amount */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total payable</div>
          <div style={{ fontSize: '2.75rem', fontWeight: 'bold', color: '#00C853', lineHeight: 1 }}>
            ₹{totalPayable}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Energy ₹{preload.estimatedAmount || '—'} + Booking fee ₹{preload.bookingFee || '—'}
          </div>
        </div>

        {/* QR */}
        <div style={{ background: '#FFF', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <QRCodeSVG value={upiUrl} size={200} fgColor="#1A1A2E" bgColor="#FFFFFF" level="H" />
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>UPI ID:</span>
          <strong>orionvolt@axl</strong>
        </div>

        {/* Booking summary */}
        {preload.kioskLocation && (
          <div style={{ width: '100%', background: 'var(--input-bg)', borderRadius: '10px', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Kiosk</div>
                <div style={{ fontWeight: 600 }}>{preload.kioskLocation}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Slot duration</div>
                <div style={{ fontWeight: 600 }}>{preload.slotDurationMinutes} min</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Arrival</div>
                <div style={{ fontWeight: 600 }}>{formatTime(preload.arrivalTime)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Energy target</div>
                <div style={{ fontWeight: 600 }}>{preload.targetEnergyKwh} kWh</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ width: '100%', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn"
            style={{ width: '100%', backgroundColor: '#00C853', color: '#000', fontWeight: 'bold' }}
            onClick={handlePaid}
            disabled={verifying}
          >
            {verifying ? 'Confirming...' : 'I have paid — Confirm Booking'}
          </button>
          <button
            className="btn"
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={() => navigate('/slot-booking')}
            disabled={verifying}
          >
            Cancel
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} color="#00C853" /> Payment secured by UPI
        </div>
      </div>
    </div>
  );
};

export default SlotBookingPayment;
