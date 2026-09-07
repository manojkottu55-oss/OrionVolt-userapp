import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Zap, Percent, IndianRupee, Calendar, Clock,
  ChevronRight, ChevronLeft, CheckCircle, RefreshCw, AlertTriangle,
  PlayCircle, Loader
} from 'lucide-react';
import api from '../api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusColor(s) {
  const map = {
    pending_payment: '#f59e0b',
    confirmed:       '#3b82f6',
    active_unlocked: '#00C853',
    charging:        '#8b5cf6',
    completed:       '#6b7280',
    cancelled:       '#ef4444',
    no_show:         '#ef4444'
  };
  return map[s] || '#6b7280';
}

function statusLabel(s) {
  return {
    pending_payment: 'Awaiting Payment',
    confirmed:       'Confirmed – Enter Code at Kiosk',
    active_unlocked: '🔓 Kiosk Unlocked – Start Charging',
    charging:        'Charging',
    completed:       'Completed',
    cancelled:       'Cancelled',
    no_show:         'No-Show'
  }[s] || s;
}

// ─── Mode Card (reused from Charge page pattern) ─────────────────────────────
const ModeCard = ({ icon, title, description, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '1rem',
      borderRadius: '14px',
      border: `2px solid ${selected ? '#00C853' : 'var(--border)'}`,
      background: selected ? 'rgba(0,200,83,0.07)' : 'var(--card-bg)',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s'
    }}
  >
    <div style={{ color: selected ? '#00C853' : 'var(--text-muted)', marginBottom: '0.4rem' }}>{icon}</div>
    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{title}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{description}</div>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const SlotBooking = () => {
  const navigate = useNavigate();

  // ── State: kiosks ──
  const [kiosks, setKiosks] = useState([]);
  const [kiosksLoading, setKiosksLoading] = useState(true);
  const [selectedKiosk, setSelectedKiosk] = useState(null);

  // ── State: wizard ──
  const [step, setStep] = useState(0); // 0=kiosk, 1=vehicle, 2=goal, 3=time, 4=summary
  const [wizardOpen, setWizardOpen] = useState(false);

  // ── State: vehicle ──
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);

  // ── State: charging goal ──
  const [chargingMode, setChargingMode] = useState('amount');
  const [amountValue, setAmountValue] = useState('');
  const [percentageGain, setPercentageGain] = useState('');

  // ── State: arrival time ──
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  // ── State: calculation result ──
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState('');

  // ── State: booking creation ──
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── State: my bookings ──
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [startingCharging, setStartingCharging] = useState('');
  const [cancelBookingModal, setCancelBookingModal] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Polling ref for confirmed bookings
  const pollRef = useRef(null);

  // ── Init: load kiosks + bookings + vehicles ──
  useEffect(() => {
    fetchKiosks();
    fetchMyBookings();
    fetchVehicles();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Poll confirmed bookings every 5s ──
  useEffect(() => {
    const hasConfirmed = myBookings.some(b => b.status === 'confirmed');
    if (hasConfirmed) {
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchMyBookings, 5000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [myBookings]);

  async function fetchKiosks() {
    try {
      setKiosksLoading(true);
      const res = await api.get('/kiosks');
      const ks = (res.data.kiosks || res.data || []).map(k => ({
        id: k.kiosk_id || k.id,
        name: k.name || k.kiosk_id,
        location: k.location || 'Unknown',
        status: k.status || 'online',
        latitude: k.latitude,
        longitude: k.longitude
      }));
      setKiosks(ks);
    } catch {
      setKiosks([]);
    } finally {
      setKiosksLoading(false);
    }
  }

  async function fetchMyBookings() {
    try {
      const res = await api.get('/bookings');
      setMyBookings(res.data.bookings || []);
    } catch {
      setMyBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const res = await api.get('/vehicles');
      const vehicles = res.data.vehicles || [];
      setAllVehicles(vehicles);
      const types = [...new Set(vehicles.map(v => v.type))];
      setVehicleTypes(types);
    } catch {
      setAllVehicles([]);
    }
  }

  // ── Vehicle cascades ──
  useEffect(() => {
    if (selectedType) {
      const filtered = allVehicles.filter(v => v.type === selectedType);
      const makes = [...new Set(filtered.map(v => v.make))];
      setCompanies(makes);
      setSelectedCompany('');
      setSelectedVehicle(null);
      setModels([]);
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedCompany) {
      const filtered = allVehicles.filter(v => v.type === selectedType && v.make === selectedCompany);
      setModels(filtered);
      setSelectedVehicle(null);
    }
  }, [selectedCompany]);

  // ── Open wizard ──
  function openWizard(kiosk) {
    setSelectedKiosk(kiosk);
    setStep(1);
    setWizardOpen(true);
    setCalcResult(null);
    setCreateError('');
    setCalcError('');
  }

  // ── Calculate estimate ──
  async function calculate() {
    setCalcError('');
    setCalcResult(null);
    if (!selectedVehicle) return setCalcError('Please select a vehicle.');
    if (chargingMode === 'amount' && (!amountValue || parseFloat(amountValue) <= 0)) return setCalcError('Enter a valid amount.');
    if (chargingMode === 'percentage' && (!percentageGain || parseFloat(percentageGain) <= 0 || parseFloat(percentageGain) > 100)) return setCalcError('Enter a valid percentage (1–100).');
    if (!arrivalDate || !arrivalTime) return setCalcError('Select arrival date and time.');

    setCalculating(true);
    try {
      const res = await api.post('/charge/booking-calculate', {
        vehicleId:      selectedVehicle.id,
        chargingMode,
        amount:         chargingMode === 'amount' ? parseFloat(amountValue) : undefined,
        percentageGain: chargingMode === 'percentage' ? parseFloat(percentageGain) : undefined
      });
      setCalcResult(res.data);
      setStep(4);
    } catch (err) {
      setCalcError(err.response?.data?.error || 'Calculation failed. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  // ── Create booking and navigate to payment ──
  async function confirmBooking() {
    if (!calcResult) return;
    setCreateError('');
    setCreating(true);

    const arrivalISO = new Date(`${arrivalDate}T${arrivalTime}`).toISOString();
    const slotEnd = new Date(new Date(arrivalISO).getTime() + calcResult.slotDurationMinutes * 60000).toISOString();

    try {
      const res = await api.post('/bookings', {
        kioskId:               selectedKiosk.id,
        kioskName:             selectedKiosk.name,
        vehicleId:             selectedVehicle.id,
        vehicleModel:          `${selectedVehicle.make} ${selectedVehicle.model}`,
        chargingMode,
        targetEnergyKwh:       calcResult.targetEnergyKwh,
        estimatedAmount:       calcResult.estimatedAmount,
        estimatedSocGain:      calcResult.estimatedSocGainPercent,
        estimatedTimeMinutes:  calcResult.estimatedTimeMinutes,
        slotDurationMinutes:   calcResult.slotDurationMinutes,
        bookingFee:            calcResult.bookingFee,
        totalPayable:          calcResult.totalPayable,
        arrivalTime:           arrivalISO
      });

      if (res.data.success) {
        navigate(`/slot-booking/pay/${res.data.booking.id}`, {
          state: {
            kioskLocation:       selectedKiosk.location,
            kioskId:             selectedKiosk.id,
            totalPayable:        calcResult.totalPayable,
            estimatedAmount:     calcResult.estimatedAmount,
            bookingFee:          calcResult.bookingFee,
            targetEnergyKwh:     calcResult.targetEnergyKwh,
            slotDurationMinutes: calcResult.slotDurationMinutes,
            arrivalTime:         arrivalISO,
            slotEndTime:         slotEnd
          }
        });
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  // ── Cancel booking ──
  async function handleCancelBooking() {
    if (!cancelBookingModal) return;
    setIsCancelling(true);
    try {
      await api.post(`/bookings/${cancelBookingModal.id}/cancel`);
      setMyBookings(prev => prev.map(b => 
        b.id === cancelBookingModal.id ? { ...b, status: 'cancelled' } : b
      ));
      setCancelBookingModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  }

  // ── Start charging from unlocked booking ──
  async function startChargingFromBooking(bookingId) {
    setStartingCharging(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/start-charging`);
      if (res.data.success) {
        navigate(`/charging/${res.data.sessionId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start charging. Please try again.');
    } finally {
      setStartingCharging('');
    }
  }

  // ─── Render: Wizard steps ──────────────────────────────────────────────────

  const wizardStepTitles = ['', 'Select Vehicle', 'Charging Goal', 'Arrival Time', 'Review & Pay'];

  const renderWizard = () => {
    if (!wizardOpen) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }} onClick={e => { if (e.target === e.currentTarget) setWizardOpen(false); }}>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480,
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          {/* Wizard header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : setWizardOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <ChevronLeft size={22} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{wizardStepTitles[step]}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedKiosk?.name} • {selectedKiosk?.location}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4].map(s => (
                <div key={s} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: step >= s ? '#00C853' : 'var(--border)',
                  transition: 'background 0.2s'
                }} />
              ))}
            </div>
          </div>

          {/* Step 1: Vehicle */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Vehicle Type</label>
                <select
                  className="form-select"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                >
                  <option value="">Select type...</option>
                  {vehicleTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              {selectedType && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Company</label>
                  <select
                    className="form-select"
                    value={selectedCompany}
                    onChange={e => setSelectedCompany(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  >
                    <option value="">Select company...</option>
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {selectedCompany && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Model</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {models.map(m => (
                      <button key={m.id}
                        onClick={() => setSelectedVehicle(m)}
                        style={{
                          padding: '0.7rem 1rem', borderRadius: '10px', textAlign: 'left',
                          border: `2px solid ${selectedVehicle?.id === m.id ? '#00C853' : 'var(--border)'}`,
                          background: selectedVehicle?.id === m.id ? 'rgba(0,200,83,0.07)' : 'var(--input-bg)',
                          cursor: 'pointer', color: 'var(--text)', fontSize: '0.875rem'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{m.model}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{m.battery_capacity_kwh} kWh</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="btn"
                style={{ background: '#00C853', color: '#000', fontWeight: 700, marginTop: '0.5rem' }}
                disabled={!selectedVehicle}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight size={18} style={{ display: 'inline' }} />
              </button>
            </div>
          )}

          {/* Step 2: Charging goal */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <ModeCard
                  icon={<IndianRupee size={20} />}
                  title="By Amount"
                  description="Set how much ₹ to spend"
                  selected={chargingMode === 'amount'}
                  onClick={() => setChargingMode('amount')}
                />
                <ModeCard
                  icon={<Percent size={20} />}
                  title="By % Gain"
                  description="Set battery % to add"
                  selected={chargingMode === 'percentage'}
                  onClick={() => setChargingMode('percentage')}
                />
              </div>

              {chargingMode === 'amount' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Amount (₹)</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', overflow: 'hidden' }}>
                    <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number" value={amountValue} onChange={e => setAmountValue(e.target.value)}
                      placeholder="e.g. 150"
                      style={{ flex: 1, border: 'none', background: 'none', padding: '0.6rem 0.5rem', color: 'var(--text)', outline: 'none', fontSize: '1rem' }}
                    />
                  </div>
                </div>
              )}

              {chargingMode === 'percentage' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Battery % to gain</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', overflow: 'hidden' }}>
                    <input
                      type="number" value={percentageGain} onChange={e => setPercentageGain(e.target.value)}
                      min="1" max="100" placeholder="e.g. 40"
                      style={{ flex: 1, border: 'none', background: 'none', padding: '0.6rem 0.75rem', color: 'var(--text)', outline: 'none', fontSize: '1rem' }}
                    />
                    <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    This is the gain to add — not your current level.
                  </p>
                </div>
              )}

              <button
                className="btn"
                style={{ background: '#00C853', color: '#000', fontWeight: 700 }}
                onClick={() => setStep(3)}
                disabled={(chargingMode === 'amount' && !amountValue) || (chargingMode === 'percentage' && !percentageGain)}
              >
                Continue <ChevronRight size={18} style={{ display: 'inline' }} />
              </button>
            </div>
          )}

          {/* Step 3: Arrival time */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Arrival Date
                </label>
                <input
                  type="date"
                  value={arrivalDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setArrivalDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> Arrival Time
                </label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                />
              </div>

              {calcError && (
                <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem' }}>
                  {calcError}
                </div>
              )}

              <button
                className="btn"
                style={{ background: '#00C853', color: '#000', fontWeight: 700 }}
                onClick={calculate}
                disabled={calculating || !arrivalDate || !arrivalTime}
              >
                {calculating ? <><RefreshCw size={16} style={{ display: 'inline', marginRight: 6, animation: 'spin 1s linear infinite' }} /> Calculating...</> : 'Calculate & Review'}
              </button>
            </div>
          )}

          {/* Step 4: Review & confirm */}
          {step === 4 && calcResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--input-bg)', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Summary</div>
                {[
                  ['Kiosk', `${selectedKiosk?.name} — ${selectedKiosk?.location}`],
                  ['Vehicle', `${selectedVehicle?.make} ${selectedVehicle?.model}`],
                  ['Energy target', `${calcResult.targetEnergyKwh} kWh (~${calcResult.estimatedSocGainPercent}% gain)`],
                  ['Arrival', `${arrivalDate} at ${arrivalTime}`],
                  ['Est. charging time', `${calcResult.estimatedTimeMinutes} min`],
                  ['Slot duration', `${calcResult.slotDurationMinutes} min (incl. 10 min grace)`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                  {[
                    ['Energy cost', `₹${calcResult.estimatedAmount}`],
                    ['Booking fee', `₹${calcResult.bookingFee}`]
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                    <span>Total Payable</span>
                    <span style={{ color: '#00C853' }}>₹{calcResult.totalPayable}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '0.75rem' }}>
                <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                  Booking fee is non-refundable. Energy amount is non-refundable for no-shows.
                </p>
              </div>

              {createError && (
                <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem' }}>
                  {createError}
                </div>
              )}

              <button
                className="btn"
                style={{ background: '#00C853', color: '#000', fontWeight: 700 }}
                onClick={confirmBooking}
                disabled={creating}
              >
                {creating ? 'Creating booking...' : `Pay ₹${calcResult.totalPayable} & Confirm`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Kiosk status helpers ─────────────────────────────────────────────────
  const kioskStatusColor = s => ({
    online: '#00C853', available: '#00C853',
    charging: '#f59e0b', booked: '#3b82f6',
    offline: '#6b7280', fault: '#ef4444'
  }[s] || '#6b7280');

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <h2 style={{ color: 'var(--text)', marginBottom: '0.25rem' }}>Slot Booking</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Reserve a kiosk, pay upfront, and get a 4-digit access code for the keypad.
      </p>

      {/* ── Available Kiosks ───────────────────────────────────────────────── */}
      <h3 style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>Available Kiosks</h3>

      {kiosksLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Loading kiosks...</div>
      ) : kiosks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          No kiosks found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {kiosks.map(k => (
            <div key={k.id} className="card" style={{ 
              padding: '1.25rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              transition: 'transform 0.2s ease'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{k.name}</span>
                  <span style={{
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.7rem',
                    fontWeight: 700, 
                    background: `${kioskStatusColor(k.status)}20`, 
                    color: kioskStatusColor(k.status),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: kioskStatusColor(k.status) }} />
                    {k.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} /> 
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{k.location}</span>
                </div>
              </div>
              <button
                className="btn"
                style={{
                  width: '100%', fontSize: '0.9rem', fontWeight: 700, padding: '0.75rem', borderRadius: '12px',
                  background: k.status === 'offline' ? 'var(--border)' : '#00C853',
                  color: k.status === 'offline' ? 'var(--text-muted)' : '#000',
                  cursor: k.status === 'offline' ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'opacity 0.2s ease, transform 0.1s ease'
                }}
                disabled={k.status === 'offline'}
                onClick={() => openWizard(k)}
                onMouseOver={(e) => { if(k.status !== 'offline') e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={(e) => { if(k.status !== 'offline') e.currentTarget.style.opacity = '1'; }}
                onMouseDown={(e) => { if(k.status !== 'offline') e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { if(k.status !== 'offline') e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {k.status === 'offline' ? 'Offline' : 'Book This Kiosk'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── My Bookings ────────────────────────────────────────────────────── */}
      <h3 style={{ color: 'var(--text)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>My Bookings</h3>

      {bookingsLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Loading bookings...</div>
      ) : myBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          No bookings yet. Select a kiosk above to book a slot.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {myBookings.map(b => (
            <div key={b.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{b.kiosk_location || b.kiosk_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.vehicle_model || 'Vehicle'}</div>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem',
                  fontWeight: 600, background: `${statusColor(b.status)}20`, color: statusColor(b.status)
                }}>
                  {statusLabel(b.status)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>From: </span>
                  <span style={{ color: 'var(--text)' }}>{formatDateTime(b.arrival_time)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Until: </span>
                  <span style={{ color: 'var(--text)' }}>{formatDateTime(b.slot_end_time)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                  <span style={{ color: '#00C853', fontWeight: 600 }}>₹{b.total_payable}</span>
                </div>
                {b.access_code && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Code: </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: '#00C853' }}>{b.access_code}</span>
                  </div>
                )}
              </div>

              {/* Start Charging button for active_unlocked bookings */}
              {b.status === 'active_unlocked' && (
                <button
                  className="btn"
                  style={{ width: '100%', background: '#00C853', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
                  onClick={() => startChargingFromBooking(b.id)}
                  disabled={startingCharging === b.id}
                >
                  {startingCharging === b.id
                    ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Starting...</>
                    : <><PlayCircle size={16} /> Start Charging</>}
                </button>
              )}

              {b.status === 'confirmed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
                  <RefreshCw size={12} style={{ animation: 'spin 3s linear infinite' }} />
                  Waiting for kiosk keypad entry...
                </div>
              )}

              {(b.status === 'pending_payment' || b.status === 'confirmed') && (
                <button
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: 'max-content'
                  }}
                  onClick={() => setCancelBookingModal(b)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Wizard modal */}
      {renderWizard()}

      {/* Cancel Confirmation Modal */}
      {cancelBookingModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ background: 'var(--card-bg)', padding: '1.5rem', width: '100%', maxWidth: 320, textAlign: 'center' }}>
            <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Cancel this booking?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              {cancelBookingModal.kiosk_location || cancelBookingModal.kiosk_id}<br/>
              {formatDateTime(cancelBookingModal.arrival_time)}
              <br/><br/>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--border)', color: 'var(--text)' }}
                onClick={() => setCancelBookingModal(null)}
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: '#ef4444', color: '#fff' }}
                onClick={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SlotBooking;
