import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { BatteryCharging, Clock, Zap } from 'lucide-react';

const Setup = () => {
  const navigate = useNavigate();
  const kioskId = localStorage.getItem('currentKioskId') || 'Unknown';
  
  const [vehicleType, setVehicleType] = useState('2_wheeler');
  const [mode, setMode] = useState('duration'); // 'duration' or 'energy'
  const [durationVal, setDurationVal] = useState(30); // minutes
  const [energyVal, setEnergyVal] = useState(2); // kWh
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fixed tariff based on backend config (ideally fetched from an endpoint)
  const TARIFFS = {
    base_charge: 10,
    per_kwh: 15,
    per_minute: 2
  };

  useEffect(() => {
    // Calculate estimated cost
    let cost = TARIFFS.base_charge;
    if (mode === 'duration') {
      cost += (durationVal * TARIFFS.per_minute);
    } else {
      cost += (energyVal * TARIFFS.per_kwh);
    }
    // Add 18% GST (assuming standard for EV)
    cost = cost * 1.18;
    setEstimatedCost(Math.round(cost));
  }, [mode, durationVal, energyVal]);

  const handleProceed = async () => {
    if (kioskId === 'Unknown') {
      return setError('No kiosk selected. Please scan a QR code first.');
    }
    
    setLoading(true);
    setError('');
    try {
      const payload = {
        kioskId,
        vehicleType,
        estimatedAmount: estimatedCost,
        targetType: mode,
        targetValue: mode === 'duration' ? durationVal : energyVal
      };

      const res = await api.post('/signin/session', payload);
      const sessionId = res.data.session.sessionId;
      
      // Proceed to generate payment
      const payRes = await api.post(`/signin/session/${sessionId}/pay`);
      
      // Navigate to payment screen
      navigate(`/payment/${sessionId}`, { state: { paymentLink: payRes.data.paymentLink, qrCode: payRes.data.qrCode } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <h1>Charging Setup</h1>
      <p className="subtitle">Kiosk: {kioskId}</p>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 500 }}>{error}</p>}

      <div className="card">
        <label className="input-label">Vehicle Type</label>
        <div className="flex gap-2 mb-4">
          <button 
            className={`btn ${vehicleType === '2_wheeler' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVehicleType('2_wheeler')}
            style={{flex: 1, padding: '0.5rem'}}
          >
            2-Wheeler
          </button>
          <button 
            className={`btn ${vehicleType === '3_wheeler' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVehicleType('3_wheeler')}
            style={{flex: 1, padding: '0.5rem'}}
          >
            3-Wheeler
          </button>
          <button 
            className={`btn ${vehicleType === '4_wheeler' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVehicleType('4_wheeler')}
            style={{flex: 1, padding: '0.5rem'}}
          >
            4-Wheeler
          </button>
        </div>

        <label className="input-label">Charging Target</label>
        <div className="flex gap-2 mb-4">
          <button 
            className={`btn ${mode === 'duration' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('duration')}
            style={{flex: 1, padding: '0.5rem'}}
          >
            <Clock size={16} /> Time
          </button>
          <button 
            className={`btn ${mode === 'energy' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('energy')}
            style={{flex: 1, padding: '0.5rem'}}
          >
            <Zap size={16} /> Energy
          </button>
        </div>

        {mode === 'duration' ? (
          <div className="input-group">
            <label className="input-label flex justify-between">
              <span>Duration (Minutes)</span>
              <span style={{color: 'var(--primary)', fontSize: '1.25rem'}}>{durationVal} min</span>
            </label>
            <input 
              type="range" 
              min="15" max="240" step="15" 
              value={durationVal} 
              onChange={e => setDurationVal(Number(e.target.value))}
              style={{width: '100%', marginTop: '1rem'}}
            />
          </div>
        ) : (
          <div className="input-group">
            <label className="input-label flex justify-between">
              <span>Energy (kWh)</span>
              <span style={{color: 'var(--primary)', fontSize: '1.25rem'}}>{energyVal} kWh</span>
            </label>
            <input 
              type="range" 
              min="1" max="50" step="1" 
              value={energyVal} 
              onChange={e => setEnergyVal(Number(e.target.value))}
              style={{width: '100%', marginTop: '1rem'}}
            />
          </div>
        )}

        <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '0.5rem', marginTop: '1.5rem' }}>
          <div className="flex justify-between items-center">
            <span style={{fontWeight: 600}}>Estimated Cost (inc. GST)</span>
            <span style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)'}}>₹{estimatedCost}</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary mt-4" onClick={handleProceed} disabled={loading} style={{padding: '1rem', fontSize: '1.1rem'}}>
        <BatteryCharging size={24} />
        {loading ? 'Initializing...' : 'Proceed to Pay'}
      </button>
    </div>
  );
};

export default Setup;
