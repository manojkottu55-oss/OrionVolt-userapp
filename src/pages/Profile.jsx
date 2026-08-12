import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, CheckCircle, Car, Plus, Trash2, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import api from '../api';

const Profile = () => {
  const { user } = useAuth();
  const { profile, vehicles, refreshProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  // State for Add Vehicle Form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [masterVehicles, setMasterVehicles] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: '',
    company: '',
    vehicleId: '',
    registrationNumber: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        mobileNumber: profile.mobile_number || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (showAddVehicle && masterVehicles.length === 0) {
      api.get('/vehicles').then(res => {
        if (res.data && res.data.vehicles) {
          setMasterVehicles(res.data.vehicles);
        }
      }).catch(console.error);
    }
  }, [showAddVehicle, masterVehicles.length]);

  useEffect(() => {
    if (vehicleForm.vehicleType) {
      const companies = [...new Set(masterVehicles.filter(v => v.type === vehicleForm.vehicleType).map(v => v.make))];
      setAvailableCompanies(companies);
      if (vehicleForm.company && !companies.includes(vehicleForm.company)) {
        setVehicleForm(prev => ({ ...prev, company: '', vehicleId: '' }));
      }
    } else {
      setAvailableCompanies([]);
      setAvailableModels([]);
    }
  }, [vehicleForm.vehicleType, masterVehicles]);

  useEffect(() => {
    if (vehicleForm.company && vehicleForm.vehicleType) {
      const models = masterVehicles.filter(v => v.type === vehicleForm.vehicleType && v.make === vehicleForm.company);
      setAvailableModels(models);
      if (vehicleForm.vehicleId && !models.find(m => m.id === vehicleForm.vehicleId)) {
        setVehicleForm(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setAvailableModels([]);
    }
  }, [vehicleForm.company, vehicleForm.vehicleType, masterVehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
    setError('');
  };

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await api.patch('/profile', {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        profileCompleted: true // Ensure it stays completed
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/profile/vehicles', {
        ...vehicleForm,
        registrationNumber: vehicleForm.registrationNumber.toUpperCase(),
        isDefault: vehicles.length === 0 // If it's the first vehicle, make it default
      });
      await refreshProfile();
      setShowAddVehicle(false);
      setVehicleForm({ vehicleType: '', company: '', vehicleId: '', registrationNumber: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add vehicle');
    }
  };

  const handleRemoveVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle?')) return;
    try {
      await api.delete(`/profile/vehicles/${id}`);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to remove vehicle');
    }
  };

  const handleSetDefaultVehicle = async (id) => {
    try {
      await api.patch(`/profile/vehicles/${id}/default`);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to set default vehicle');
    }
  };

  const inputStyle = {
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    background: 'var(--input-bg)',
    color: 'var(--text-light)',
    outline: 'none',
    transition: 'border-color 0.3s',
    width: '100%'
  };

  const labelStyle = {
    fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)',
    marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  };

  const IconWrapper = ({ children, color }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '28px', height: '28px', borderRadius: '8px',
      background: `rgba(${color}, 0.15)`, color: `rgb(${color})`
    }}>
      {children}
    </div>
  );

  if (!profile) return <div className="page-content pb-12">Loading...</div>;

  const getCompleteness = () => {
    let score = 0;
    if (profile.name) score += 33;
    if (profile.mobile_number) score += 33;
    if (vehicles.length > 0) score += 34;
    return score;
  };

  return (
    <div className="page-content pb-12" style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div className="flex flex-col items-center justify-center gap-1 mb-8" style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{
          marginBottom: 0, fontSize: '2.5rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>My Profile</h1>
        <p className="subtitle text-center" style={{ fontSize: '1.1rem' }}>
          {getCompleteness()}% Complete {getCompleteness() === 100 && '✅'}
        </p>
      </div>

      <div className="card max-w-2xl mx-auto" style={{ 
        padding: '2.5rem', borderRadius: '24px', background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)', border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px -12px var(--shadow-color)', position: 'relative', zIndex: 1
      }}>
        
        {user?.user_metadata?.avatar_url && (
          <div className="flex justify-center mb-8 relative">
            <div style={{
              padding: '4px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
              borderRadius: '50%', boxShadow: '0 0 20px var(--primary-alpha)'
            }}>
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-card)' }} />
            </div>
          </div>
        )}

        {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label style={labelStyle}><IconWrapper color="59, 130, 246"><User size={14} /></IconWrapper> Full Name</label>
              <input type="text" name="name" style={inputStyle} value={formData.name} onChange={handleChange} required />
            </div>
            
            <div>
              <label style={labelStyle}><IconWrapper color="239, 68, 68"><Mail size={14} /></IconWrapper> Email (Google)</label>
              <input type="email" style={{...inputStyle, opacity: 0.6}} value={formData.email} readOnly />
            </div>

            <div>
              <label style={labelStyle}><IconWrapper color="16, 185, 129"><Phone size={14} /></IconWrapper> Mobile Number</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ ...inputStyle, width: 'auto', background: 'var(--hover-bg-subtle)' }}>+91</div>
                <input type="tel" name="mobileNumber" style={inputStyle} value={formData.mobileNumber} onChange={handleChange} maxLength="10" required />
              </div>
            </div>

            <div>
              <label style={labelStyle}><IconWrapper color="245, 158, 11"><Calendar size={14} /></IconWrapper> Member Since</label>
              <input type="text" style={{...inputStyle, opacity: 0.6}} value={new Date(profile.created_at).toLocaleDateString()} readOnly />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={isSaving}>
            {isSaving ? 'Saving...' : saved ? <><CheckCircle size={20}/> Saved!</> : <><Save size={20}/> Save Changes</>}
          </button>
        </form>

        <hr style={{ borderColor: 'var(--border-light)', margin: '2.5rem 0' }} />

        {/* Vehicles Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car size={20} color="var(--primary)" /> My Vehicles
            </h3>
            {!showAddVehicle && (
              <button onClick={() => setShowAddVehicle(true)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> Add Vehicle
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {vehicles.map(v => (
              <div key={v.id} style={{ 
                padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', 
                background: v.is_default ? 'var(--hover-bg)' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.vehicle_make}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.vehicle_registration_number} • {v.vehicle_type.replace('_', ' ')}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleSetDefaultVehicle(v.id)}
                    title={v.is_default ? "Default Vehicle" : "Set as Default"}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.is_default ? '#f59e0b' : 'var(--text-muted)' }}
                  >
                    <Star size={20} fill={v.is_default ? "#f59e0b" : "none"} />
                  </button>
                  <button 
                    onClick={() => handleRemoveVehicle(v.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && !showAddVehicle && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No vehicles added yet.</div>
            )}
          </div>

          {showAddVehicle && (
            <form onSubmit={handleAddVehicle} style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--hover-bg-subtle)', borderRadius: '12px' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="vehicleType" value={vehicleForm.vehicleType} onChange={handleVehicleChange} style={inputStyle} required>
                  <option value="">Select Type</option>
                  <option value="two_wheeler">Two Wheeler</option>
                  <option value="three_wheeler">Three Wheeler</option>
                  <option value="four_wheeler">Four Wheeler</option>
                </select>
                <select name="company" value={vehicleForm.company} onChange={handleVehicleChange} style={inputStyle} disabled={!vehicleForm.vehicleType} required>
                  <option value="">Select Company</option>
                  {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="vehicleId" value={vehicleForm.vehicleId} onChange={handleVehicleChange} style={inputStyle} disabled={!vehicleForm.company} required>
                  <option value="">Select Model</option>
                  {availableModels.map(m => <option key={m.id} value={m.id}>{m.model}</option>)}
                </select>
                <input type="text" name="registrationNumber" placeholder="Registration (e.g. AP16AB1234)" value={vehicleForm.registrationNumber} onChange={handleVehicleChange} style={{...inputStyle, textTransform: 'uppercase'}} required />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Vehicle</button>
                <button type="button" onClick={() => setShowAddVehicle(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
