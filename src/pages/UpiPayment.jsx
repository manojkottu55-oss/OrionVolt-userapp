import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Zap, Clock, ShieldCheck, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api';

const UpiPayment = () => {
  const { id } = useParams(); // sessionId
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('waiting_user'); // waiting_user, paid, failed
  
  // Try to get data from location state first, fallback to fetching
  const stateAmount = location.state?.amount;
  const stateVehicle = location.state?.vehicleModel;
  
  const [sessionDetails, setSessionDetails] = useState({
    amount: stateAmount || 0,
    vehicleModel: stateVehicle || 'Unknown Vehicle',
    targetEnergy: 0,
    duration: 0
  });

  useEffect(() => {
    // If we don't have the amount from state, fetch the session details
    const fetchSession = async () => {
      try {
        const res = await api.get(`/signin/session/${id}`);
        const session = res.data.session;
        setSessionDetails({
          amount: session.estimated_amount,
          vehicleModel: session.vehicle_id || 'Unknown Vehicle',
          targetEnergy: session.requested_energy,
          duration: session.requested_duration
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError('Failed to load session details.');
        setLoading(false);
      }
    };

    if (!stateAmount) {
      fetchSession();
    } else {
      setLoading(false);
    }
  }, [id, stateAmount]);

  const handlePaid = async () => {
    setVerifying(true);
    setError('');
    
    try {
      const res = await api.post('/payment/demo-verify', { sessionId: id });
      
      if (res.data.success) {
        setStatus('paid');
        fireConfetti();
      } else {
        setError('Payment verification failed.');
        setStatus('failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Failed to verify payment. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00C853', '#4ADE80', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00C853', '#4ADE80', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (loading) {
    return (
      <div className="page-content flex flex-col items-center justify-center">
        <div style={{ color: 'var(--text-muted)' }}>Loading payment details...</div>
      </div>
    );
  }

  // Generate UPI URI
  const upiUrl = `upi://pay?pa=orionvolt@okaxis&pn=OrionVolt&am=${sessionDetails.amount}&cu=INR&tn=EV+Charging+Payment`;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/charge')}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', color: 'var(--text)' }}>Checkout</h2>
        <div style={{ width: '40px' }}></div> {/* balance flex */}
      </div>

      {status === 'waiting_user' || status === 'failed' ? (
        <div className="card" style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Scan with any UPI app</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00C853', lineHeight: '1' }}>
              ₹{sessionDetails.amount}
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <QRCodeSVG 
              value={upiUrl}
              size={220}
              fgColor="#1A1A2E"
              bgColor="#FFFFFF"
              level="H"
            />
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>UPI ID:</span>
            <strong>orionvolt@okaxis</strong>
          </div>

          {/* Dummy Apps Icons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
          </div>

          {error && (
            <div style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn" 
              style={{ width: '100%', backgroundColor: '#00C853', color: '#000', fontWeight: 'bold' }}
              onClick={handlePaid}
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'I have paid'}
            </button>
            <button 
              className="btn" 
              style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
              onClick={() => navigate('/charge')}
              disabled={verifying}
            >
              Cancel Payment
            </button>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <ShieldCheck size={14} color="#00C853" />
            Payment secured by UPI
          </div>

        </div>
      ) : (
        /* Success Screen */
        <div className="card" style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ marginBottom: '1.5rem', animation: 'scaleIn 0.5s ease-out' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#00C853" fillOpacity="0.2"/>
              <circle cx="40" cy="40" r="30" fill="#00C853"/>
              <path d="M30 40L37 47L50 34" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 style={{ color: '#00C853', margin: '0 0 0.5rem 0' }}>Payment Received!</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 2rem 0', fontSize: '0.875rem' }}>
            Your charging session has started.
          </p>

          <div style={{ 
            width: '100%', 
            backgroundColor: 'var(--input-bg)', 
            borderRadius: '12px', 
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Session Details</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehicle</div>
                <div style={{ fontWeight: '600' }}>{sessionDetails.vehicleModel || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Paid</div>
                <div style={{ fontWeight: '600', color: '#00C853' }}>₹{sessionDetails.amount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> Target Energy
                </div>
                <div style={{ fontWeight: '600' }}>{sessionDetails.targetEnergy} kWh</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Est. Time
                </div>
                <div style={{ fontWeight: '600' }}>{sessionDetails.duration} mins</div>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate(`/status/${id}`)}
          >
            View Session Status
          </button>
        </div>
      )}
    </div>
  );
};

export default UpiPayment;
