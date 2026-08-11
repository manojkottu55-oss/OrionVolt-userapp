import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CheckCircle, AlertCircle, Loader, Zap, Clock, Battery } from 'lucide-react';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ── Confetti burst animation ── */
const ConfettiBurst = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00C853', '#00E676', '#4ADE80', '#FFD700', '#00BCD4', '#FF6B6B', '#845EF7'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 4,
        size: Math.random() * 8 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    let frame = 0;
    const maxFrames = 90;

    const animate = () => {
      if (frame >= maxFrames) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - frame / maxFrames);
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
};

/* ── Animated checkmark SVG ── */
const AnimatedCheckmark = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" style={{ margin: '0 auto 1.5rem' }}>
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke="#00C853"
      strokeWidth="3"
      style={{
        strokeDasharray: 283,
        strokeDashoffset: 283,
        animation: 'drawCircle 0.6s ease forwards'
      }}
    />
    <path
      d="M30 52 L44 66 L70 38"
      fill="none"
      stroke="#00C853"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 80,
        strokeDashoffset: 80,
        animation: 'drawCheck 0.4s ease forwards 0.5s'
      }}
    />
    <style>{`
      @keyframes drawCircle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes drawCheck {
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  </svg>
);

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('initializing'); // initializing | waiting_user | verifying | paid | failed
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    if (!id) return;
    initPayment();
  }, [id]);

  const initPayment = async () => {
    try {
      // 1. Create order on backend
      const res = await api.post(`/signin/session/${id}/pay`);
      const { amount, gatewayOrderId, currency } = res.data.payment;

      // 2. Load Razorpay script
      const resLoad = await loadRazorpay();
      if (!resLoad) {
        setError('Razorpay SDK failed to load. Check your connection.');
        setStatus('failed');
        return;
      }

      // 3. Initialize Razorpay Checkout
      // NOTE: `amount` from backend is in ₹ (e.g. 40.00)
      // Razorpay expects paise, so multiply by 100
      const amountInPaise = Math.round(amount * 100);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'OrionVolt',
        description: 'EV Charging Payment',
        order_id: gatewayOrderId,
        prefill: {
          contact: '9999999999'
        },
        theme: {
          color: '#00C853'
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI / QR",
                instruments: [
                  { method: "upi", flows: ["qr", "collect", "intent"] }
                ]
              },
              other: {
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        handler: async function (response) {
          // Payment successful — verify with backend
          await verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function() {
            setError('Payment cancelled by user');
            setStatus('failed');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function(resp) {
        setError(resp.error?.description || 'Payment failed. Please try again.');
        setStatus('failed');
      });
      paymentObject.open();
      setStatus('waiting_user');
    } catch (err) {
      console.error('Payment init error:', err);
      const detail = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Failed to initialize payment. ${detail}`);
      setStatus('failed');
    }
  };

  const verifyPayment = async (paymentId, orderId, signature) => {
    setStatus('verifying');
    try {
      const res = await api.post('/payment/verify', {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        sessionId: id
      });

      if (res.data?.verified) {
        setPaymentDetails({
          paymentId,
          orderId,
          sessionId: id,
          kioskId: res.data.kioskId
        });

        // Fetch session info for display
        try {
          const sessionRes = await api.get(`/signin/session/${id}`);
          setSessionInfo(sessionRes.data?.session || null);
        } catch (e) {
          // Non-critical — proceed without session details
        }

        setStatus('paid');
      } else {
        setError('Payment verification failed. Contact support.');
        setStatus('failed');
      }
    } catch (err) {
      console.error('Verify error:', err);
      // Payment was captured by Razorpay, but our verify call failed.
      // The webhook will handle it as backup.
      setError('Payment was processed but verification is pending. You will receive confirmation shortly.');
      setStatus('failed');
    }
  };

  // ── SUCCESS SCREEN ──
  if (status === 'paid') {
    return (
      <div className="page-content" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', minHeight: '70vh', textAlign: 'center' 
      }}>
        <ConfettiBurst />
        <AnimatedCheckmark />
        
        <h1 style={{ 
          color: '#00C853', 
          fontSize: '1.8rem', 
          marginBottom: '0.5rem',
          animation: 'fadeSlideUp 0.5s ease forwards 0.8s',
          opacity: 0
        }}>
          Payment Confirmed!
        </h1>
        
        {sessionInfo && (
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#00C853', 
            marginBottom: '0.5rem',
            animation: 'fadeSlideUp 0.5s ease forwards 1s',
            opacity: 0
          }}>
            ₹{sessionInfo.estimated_amount || '—'}
          </p>
        )}

        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1rem', 
          marginBottom: '2rem',
          animation: 'fadeSlideUp 0.5s ease forwards 1.2s',
          opacity: 0
        }}>
          <Zap size={16} style={{ verticalAlign: 'middle' }} /> Charging will start shortly...
        </p>

        {sessionInfo && (
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '400px', 
            textAlign: 'left',
            animation: 'fadeSlideUp 0.5s ease forwards 1.4s',
            opacity: 0
          }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Session Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessionInfo.vehicle_type && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}><Battery size={14} style={{ verticalAlign: 'middle' }} /> Vehicle</span>
                  <span style={{ fontWeight: 600 }}>{sessionInfo.vehicle_type.replace('_', ' ')}</span>
                </div>
              )}
              {sessionInfo.requested_energy && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}><Zap size={14} style={{ verticalAlign: 'middle' }} /> Energy Target</span>
                  <span style={{ fontWeight: 600 }}>{sessionInfo.requested_energy} kWh</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}><Clock size={14} style={{ verticalAlign: 'middle' }} /> Kiosk</span>
                <span style={{ fontWeight: 600 }}>{sessionInfo.kiosk_id || paymentDetails?.kioskId || '—'}</span>
              </div>
            </div>
          </div>
        )}

        <button 
          className="btn btn-primary mt-4" 
          style={{ maxWidth: '400px', animation: 'fadeSlideUp 0.5s ease forwards 1.6s', opacity: 0 }}
          onClick={() => navigate(`/status/${id}`)}
        >
          View Charging Status
        </button>

        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── FAILED SCREEN ──
  if (status === 'failed') {
    return (
      <div className="page-content" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', minHeight: '70vh', textAlign: 'center' 
      }}>
        <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h1>Payment Failed</h1>
        <p className="subtitle" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>{error || 'Please try again.'}</p>
        <button className="btn btn-primary" style={{ maxWidth: '300px' }} onClick={() => navigate('/charge')}>Go Back to Charge</button>
      </div>
    );
  }

  // ── LOADING / WAITING SCREENS ──
  return (
    <div className="page-content" style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', minHeight: '70vh', textAlign: 'center' 
    }}>
      <Loader 
        size={48} 
        color="var(--primary)" 
        style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }} 
      />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {status === 'initializing' && <h2>Securely initializing payment...</h2>}
      {status === 'waiting_user' && <h2>Complete your payment in the Razorpay window</h2>}
      {status === 'verifying' && <h2>Verifying payment with bank...</h2>}
      
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
        {status === 'waiting_user' && 'Use UPI, Card, or Netbanking to pay'}
        {status === 'verifying' && 'This will only take a moment...'}
      </p>
    </div>
  );
};

export default Payment;
