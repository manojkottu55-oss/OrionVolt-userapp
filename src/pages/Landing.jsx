import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Loader2 } from 'lucide-react';

const Landing = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const redeemQr = async () => {
      const qrLoginToken = searchParams.get('qrLoginToken');
      const token = localStorage.getItem('token');

      if (!qrLoginToken) {
        setError('Invalid QR code. No token found.');
        return;
      }

      if (!token) {
        // Save intent for after login
        localStorage.setItem('pendingKioskId', id);
        localStorage.setItem('pendingQrToken', qrLoginToken);
        navigate('/login');
        return;
      }

      try {
        await api.post('/kiosk-qr/redeem', {
          kioskId: id,
          qrLoginToken
        });
        localStorage.setItem('currentKioskId', id);
        navigate('/setup');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to link kiosk. Please scan again.');
      }
    };

    redeemQr();
  }, [id, searchParams, navigate]);

  return (
    <div className="page-content items-center justify-center text-center">
      {error ? (
        <div className="card w-full">
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
          <button className="btn btn-outline mt-4" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin" size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="mt-4 font-semibold text-main">Connecting to {id}...</p>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Landing;
