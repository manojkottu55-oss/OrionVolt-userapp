import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Battery, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const Status = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [chargingSession, setChargingSession] = useState(null);
  const [latestReading, setLatestReading] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/signin/session/${id}`);
        setSession(res.data.session);
        setChargingSession(res.data.chargingSession);
        setLatestReading(res.data.latestReading);
      } catch (err) {
        console.error('Failed to fetch status', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (!session) return <div className="page-content text-center mt-8">Loading...</div>;

  const isCharging = session.status === 'charging';
  const isInterrupted = session.status === 'interrupted' || session.status === 'failed';
  const isCompleted = session.status === 'completed';

  const energyDispensed = chargingSession ? chargingSession.energyUsedKwh : 0;
  let durationElapsed = 0;
  if (chargingSession && chargingSession.startTime) {
    const end = chargingSession.endTime ? new Date(chargingSession.endTime) : new Date();
    durationElapsed = Math.floor((end - new Date(chargingSession.startTime)) / 60000);
  }

  return (
    <div className="page-content text-center">
      <h1>Charging Status</h1>
      <p className="subtitle">Kiosk: {session.kioskId}</p>

      {isInterrupted && (
        <div style={{ background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>Your charging was interrupted.</span>
        </div>
      )}

      {isCompleted && (
        <div style={{ background: 'var(--success)', color: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 600 }}>Charging Complete!</span>
        </div>
      )}

      {isCharging && (
        <div className="pulse-ring">
          <div className="pulse-core">
            <Zap size={32} />
          </div>
        </div>
      )}

      <div className="card text-left mt-4">
        <div className="flex justify-between mb-4">
          <span className="input-label" style={{marginBottom: 0}}>Energy Dispensed</span>
          <span style={{fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.25rem'}}>{energyDispensed.toFixed(2)} kWh</span>
        </div>
        
        <div className="flex justify-between mb-4">
          <span className="input-label" style={{marginBottom: 0}}>Time Elapsed</span>
          <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{durationElapsed} min</span>
        </div>

        {latestReading && isCharging && (
          <div className="flex justify-between mb-4" style={{ color: 'var(--warning)' }}>
            <span className="input-label" style={{marginBottom: 0}}>Live Power</span>
            <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{latestReading.power} kW</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="input-label" style={{marginBottom: 0}}>Total Paid</span>
          <span style={{fontWeight: 700, fontSize: '1.1rem'}}>₹{session.estimatedAmount}</span>
        </div>
      </div>

      {(isInterrupted || isCompleted) && (
        <button className="btn btn-outline mt-8" onClick={() => navigate('/history')}>
          View History
        </button>
      )}
    </div>
  );
};

export default Status;
