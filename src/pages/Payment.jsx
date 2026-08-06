import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    initPayment();
  }, [id]);

  const initPayment = async () => {
    try {
      // 1. Create order on backend
      const res = await api.post(`/signin/payment/${id}`);
      const { amount, gatewayOrderId, currency } = res.data.payment;

      // 2. Load Razorpay script
      const resLoad = await loadRazorpay();
      if (!resLoad) {
        setError('Razorpay SDK failed to load. Check your connection.');
        setStatus('failed');
        return;
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: amount * 100, // in paise
        currency: currency || 'INR',
        name: 'OrionVolt',
        description: 'EV Charging Session',
        order_id: gatewayOrderId,
        handler: function (response) {
          // On success, Razorpay hits our webhook backend to update status.
          // We can also notify the backend directly, but let's just start polling status.
          setStatus('polling');
        },
        prefill: {
          name: 'User',
          contact: '9999999999'
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function() {
            setError('Payment cancelled by user');
            setStatus('failed');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setStatus('waiting_user');
    } catch (err) {
      console.error(err);
      setError('Failed to initialize payment');
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (status !== 'polling') return;

    const pollStatus = async () => {
      try {
        const res = await api.get(`/signin/session/${id}`);
        const session = res.data.session;
        if (session.status === 'charging' || session.status === 'completed' || session.status === 'paid') {
          setStatus('paid');
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/status/${id}`);
          }, 1500);
        } else if (session.status === 'failed') {
          setStatus('failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [id, navigate, status]);

  if (status === 'paid') {
    return (
      <div className="page-content items-center justify-center text-center">
        <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
        <h1>Payment Successful!</h1>
        <p className="subtitle">Starting your charging session...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="page-content items-center justify-center text-center">
        <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h1>Payment Failed</h1>
        <p className="subtitle">{error || 'Please try again.'}</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/charge')}>Go Back to Charge</button>
      </div>
    );
  }

  return (
    <div className="page-content items-center justify-center text-center">
      <Loader size={48} color="var(--primary)" className="spin" style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {status === 'initializing' && <h2>Securely initializing payment...</h2>}
      {status === 'waiting_user' && <h2>Waiting for you to complete payment...</h2>}
      {status === 'polling' && <h2>Confirming payment with bank...</h2>}
    </div>
  );
};

export default Payment;
