import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isMissing } from '../supabase';
import { Smartphone, AlertTriangle } from 'lucide-react';
import ParticleText from '../components/ParticleText';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Missing credentials fallback ──
  if (isMissing) {
    return (
      <div className="page-content items-center justify-center text-center">
        <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h2>Configuration Error</h2>
        <p className="subtitle">
          Supabase credentials are missing. Please add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file and restart the dev server.
        </p>
      </div>
    );
  }

  // Check if there is a pending QR scan and redirect accordingly
  const handlePostLogin = () => {
    const kioskId = localStorage.getItem('pendingKioskId');
    if (kioskId) {
      localStorage.setItem('currentKioskId', kioskId);
      localStorage.removeItem('pendingKioskId');
      localStorage.removeItem('pendingQrToken');
      navigate('/setup');
    } else {
      navigate('/charge');
    }
  };

  // ── Mobile OTP: Step 1 — Request Demo OTP via Backend ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('Enter a valid 10-digit phone number');
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep(2);
      // For demo purposes, alert the user with the generated OTP
      if (data.demoOtp) {
        alert(`DEMO MODE: Your OTP is ${data.demoOtp}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Mobile OTP: Step 2 — Verify Demo OTP via Backend ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter the 6-digit OTP');
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid OTP');
      
      // For the demo, the backend generates an action_link (magic link token)
      // to sign the user in. We'll navigate to it to let Supabase Auth establish the session.
      if (data.actionLink) {
        window.location.href = data.actionLink;
      } else {
        // Fallback in case actionLink generation fails
        handlePostLogin();
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  // ── Google OAuth via Supabase ──
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/charge',
        },
      });
      if (oauthError) throw oauthError;
      // Supabase will redirect to Google and back — no manual navigation needed
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      {isMobile ? (
        <>
          <style>
            {`
              @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
          <h1
            className="text-center mb-4"
            style={{
              fontSize: 'clamp(1.5rem, 7vw, 2rem)',
              background: 'linear-gradient(to right, #E7EAF0, #4ADE80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'fadeSlideIn 0.6s ease-out forwards',
              fontWeight: 800,
            }}
          >
            Welcome to OrionVolt
          </h1>
        </>
      ) : (
        <div style={{ width: '100%', height: 140, background: 'transparent', padding: '0 16px' }}>
          <ParticleText
            text="Welcome to OrionVolt"
            particleSize={2}
            density={4}
            color="#E7EAF0"
            highlightColor="#4ADE80"
            scatter={160}
            gatherDuration={1400}
            stagger={350}
            pointerRepel={35}
            repelRadius={100}
            idleDrift={0.6}
            trigger="mount"
            fontSize="clamp(1.1rem, 5.5vw, 2.4rem)"
            fontWeight={800}
            fontFamily="inherit"
            glow
          />
        </div>
      )}
      <p className="subtitle text-center mb-8">Sign in to start charging your EV.</p>

      <div className="card">
        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap' }}>+91</span>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength="10"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Smartphone size={20} />
              {loading ? 'Sending OTP...' : 'Continue with Mobile'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label className="input-label">Enter OTP sent to +91 {phone}</label>
              <input
                type="text"
                className="input-field text-center"
                style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
              style={{ fontSize: '0.85rem' }}
            >
              ← Change number
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>OR</div>

        <button onClick={handleGoogleLogin} className="btn btn-outline" disabled={loading}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="G"
            style={{ width: 20, height: 20 }}
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
