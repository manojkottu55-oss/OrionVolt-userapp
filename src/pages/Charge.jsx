import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Zap, Banknote, Percent, BatteryFull, CheckCircle } from 'lucide-react';
import api from '../api';

const ModeCard = ({ title, subtitle, icon, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`mode-card ${selected ? 'selected' : ''}`}
  >
    <div className="mode-card-icon">
      {icon}
    </div>
    <div>
      <div className="mode-card-title">
        {title}
      </div>
      <div className="mode-card-subtitle">
        {subtitle}
      </div>
    </div>
  </div>
);

const Charge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);

  const [form, setForm] = useState({
    kioskId: 'KSK001',
    vehicleType: '',
    company: '',
    vehicleId: '',
    chargingMode: 'amount', // 'amount', 'percentage', 'full_charge'
    amount: '',
    currentBatteryPct: '',
    targetBatteryPct: ''
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        if (response.data && response.data.vehicles) {
          setVehicles(response.data.vehicles);
        }
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  // Compute dynamic dropdown options
  const uniqueTypes = [...new Set(vehicles.map(v => v.type))];
  const uniqueCompanies = form.vehicleType
    ? [...new Set(vehicles.filter(v => v.type === form.vehicleType).map(v => v.make))]
    : [];
  const availableModels = form.company
    ? vehicles.filter(v => v.make === form.company && v.type === form.vehicleType)
    : [];

  const handleCalculate = async () => {
    setError('');
    setCalculationResult(null);

    if (!form.vehicleId) {
      setError('Please select a specific vehicle model.');
      return;
    }

    if (form.chargingMode === 'amount' && !form.amount) {
      setError('Please enter a target amount.');
      return;
    }
    if (form.chargingMode === 'percentage' && (!form.currentBatteryPct || !form.targetBatteryPct)) {
      setError('Please enter current and target battery percentages.');
      return;
    }
    if (form.chargingMode === 'full_charge' && !form.currentBatteryPct) {
      setError('Please enter your current battery percentage.');
      return;
    }

    setCalculating(true);
    try {
      const response = await api.post('/charge/calculate', {
        vehicleId: form.vehicleId,
        chargingMode: form.chargingMode,
        amount: form.amount,
        currentBatteryPct: form.currentBatteryPct,
        targetBatteryPct: form.targetBatteryPct
      });
      setCalculationResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate charge estimate');
    } finally {
      setCalculating(false);
    }
  };

  const handleChargeInit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!calculationResult) {
      setError('Please calculate the estimate before continuing.');
      return;
    }

    setLoading(true);

    try {
      // Create a real session on the backend with vehicle & calculation data
      const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicleId));

      const sessionPayload = {
        kioskId: form.kioskId,
        vehicleType: selectedVehicle?.type || form.vehicleType,
        vehicleId: form.vehicleId,
        energy: calculationResult.targetEnergyKwh,
        targetType: form.chargingMode === 'amount' ? 'amount' : 'energy',
        targetValue: form.chargingMode === 'amount'
          ? parseFloat(form.amount)
          : calculationResult.targetEnergyKwh
      };

      const res = await api.post('/signin/session', sessionPayload);

      if (res.data?.success && res.data?.session?.session_id) {
        navigate(`/upi-payment/${res.data.session.session_id}`, {
          state: {
            amount: calculationResult.estimatedAmount,
            vehicleModel: selectedVehicle?.model || form.vehicleType,
          }
        });
      } else {
        setError('Failed to create charging session. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err.response?.data?.error || 'Failed to initialize charging session');
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ margin: 0 }}>Charge EV</h1>
        <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}>
          <MapPin size={16} />
          {form.kioskId}
        </div>
      </div>

      <div className="card">
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>{error}</div>}

        <form onSubmit={handleChargeInit}>

          {/* VEHICLE SELECTION */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>1. Vehicle Selection</h3>

            <div className="input-group">
              <label className="input-label">Vehicle Type</label>
              <select
                className="input-field"
                value={form.vehicleType}
                onChange={e => {
                  setForm({ ...form, vehicleType: e.target.value, company: '', vehicleId: '' });
                  setCalculationResult(null);
                }}
              >
                <option value="" disabled>Select Vehicle Type</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>

            {form.vehicleType && (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Company</label>
                <select
                  className="input-field"
                  value={form.company}
                  onChange={e => {
                    setForm({ ...form, company: e.target.value, vehicleId: '' });
                    setCalculationResult(null);
                  }}
                >
                  <option value="" disabled>Select Manufacturer</option>
                  {uniqueCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            )}

            {form.company && (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Model</label>
                <select
                  className="input-field"
                  value={form.vehicleId}
                  onChange={e => {
                    setForm({ ...form, vehicleId: e.target.value });
                    setCalculationResult(null);
                  }}
                >
                  <option value="" disabled>Select Model</option>
                  {availableModels.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.model}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CHARGING GOAL */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text)' }}>2. Charging Goal</h3>

            <div className="charging-modes-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <ModeCard
                title="Amount Mode"
                subtitle="Charge for a specific amount"
                icon={<Banknote size={24} />}
                selected={form.chargingMode === 'amount'}
                onClick={() => setForm({ ...form, chargingMode: 'amount', targetBatteryPct: '' })}
              />
              <ModeCard
                title="Percentage Mode"
                subtitle="Charge to a target battery %"
                icon={<Percent size={24} />}
                selected={form.chargingMode === 'percentage'}
                onClick={() => setForm({ ...form, chargingMode: 'percentage', amount: '' })}
              />
              <ModeCard
                title="Full Charge"
                subtitle="Charge to 100%"
                icon={<BatteryFull size={24} />}
                selected={form.chargingMode === 'full_charge'}
                onClick={() => setForm({ ...form, chargingMode: 'full_charge', amount: '', targetBatteryPct: '100' })}
              />
            </div>

            {/* Dynamic Inputs based on selected mode */}
            {form.chargingMode === 'amount' && (
              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter amount (e.g. 150)"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            )}

            {form.chargingMode === 'percentage' && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: '1 1 120px' }}>
                  <label className="input-label">Current Battery %</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 20"
                    value={form.currentBatteryPct}
                    onChange={e => setForm({ ...form, currentBatteryPct: e.target.value })}
                  />
                </div>
                <div className="input-group" style={{ flex: '1 1 120px' }}>
                  <label className="input-label">Target Battery %</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 80"
                    value={form.targetBatteryPct}
                    onChange={e => setForm({ ...form, targetBatteryPct: e.target.value })}
                  />
                </div>
              </div>
            )}

            {form.chargingMode === 'full_charge' && (
              <div className="input-group">
                <label className="input-label">Current Battery %</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 20"
                  value={form.currentBatteryPct}
                  onChange={e => {
                    setForm({ ...form, currentBatteryPct: e.target.value });
                    setCalculationResult(null);
                  }}
                />
              </div>
            )}

            <button
              type="button"
              className="btn"
              style={{ width: '100%', marginTop: '1rem', backgroundColor: 'var(--card-lighter)' }}
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? 'Calculating...' : 'Done'}
            </button>
          </div>

          {calculationResult && (
            <div style={{
              backgroundColor: 'var(--primary-alpha)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, color: 'var(--primary)' }}>Calculation Successful</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Energy</div>
                  <div style={{ fontWeight: '600' }}>{calculationResult.targetEnergyKwh} kWh</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Amount</div>
                  <div style={{ fontWeight: '600' }}>₹{calculationResult.estimatedAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Time</div>
                  <div style={{ fontWeight: '600' }}>{calculationResult.estimatedTimeMinutes} mins</div>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', backgroundColor: 'var(--input-bg)', padding: '0.75rem', borderRadius: '4px' }}>
                <strong>Breakdown:</strong><br />
                {calculationResult.breakdown.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !calculationResult}>
            <Zap size={20} />
            {loading ? 'Processing...' : 'Continue to Pay'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Charge;
