import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { Car, Phone, User, CheckCircle, ChevronDown } from 'lucide-react';
import api from '../api';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshProfile, profileCompleted } = useProfile();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [vehicles, setVehicles] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    mobileNumber: '',
    vehicleType: '',
    company: '',
    vehicleId: '', // Represents the specific model ID from vehicle_master
    registrationNumber: ''
  });

  // Fetch all vehicles from master to populate dropdowns
  useEffect(() => {
    // If profile is already completed, they shouldn't be here
    if (profileCompleted) {
      navigate('/charge', { replace: true });
      return;
    }

    const fetchVehicles = async () => {
      try {
        const res = await api.get('/vehicles');
        if (res.data && res.data.vehicles) {
          setVehicles(res.data.vehicles);
        }
      } catch (err) {
        console.error('Failed to fetch vehicles master list', err);
      }
    };
    fetchVehicles();
  }, [profileCompleted, navigate]);

  // Update dynamic dropdowns based on selections
  useEffect(() => {
    if (formData.vehicleType) {
      const companies = [...new Set(vehicles.filter(v => v.type === formData.vehicleType).map(v => v.make))];
      setAvailableCompanies(companies);
      
      // If selected company is no longer valid for this type, reset it
      if (formData.company && !companies.includes(formData.company)) {
        setFormData(prev => ({ ...prev, company: '', vehicleId: '' }));
      }
    } else {
      setAvailableCompanies([]);
      setAvailableModels([]);
    }
  }, [formData.vehicleType, vehicles]);

  useEffect(() => {
    if (formData.company && formData.vehicleType) {
      const models = vehicles.filter(v => v.type === formData.vehicleType && v.make === formData.company);
      setAvailableModels(models);
      
      // If selected model is no longer valid, reset it
      if (formData.vehicleId && !models.find(m => m.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.company, formData.vehicleType, vehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3) return 'Name must be at least 3 characters long.';
    if (!/^\d{10}$/.test(formData.mobileNumber)) return 'Mobile number must be exactly 10 digits.';
    if (!formData.vehicleType) return 'Please select a vehicle type.';
    if (!formData.company) return 'Please select a vehicle company.';
    if (!formData.vehicleId) return 'Please select a vehicle model.';
    
    // Basic registration check (just ensure it's not empty and > 4 chars)
    if (formData.registrationNumber.trim().length < 4) return 'Please enter a valid registration number.';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // 1. Update Profile (name, mobile, completed status)
      await api.patch('/profile', {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber,
        profileCompleted: true
      });

      // 2. Add Vehicle (marked as default since it's the first one)
      await api.post('/profile/vehicles', {
        vehicleType: formData.vehicleType,
        company: formData.company,
        vehicleId: formData.vehicleId,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        isDefault: true
      });

      // 3. Refresh Profile Context
      await refreshProfile();
      
      // Navigate to charge (Toast could be added here via context or global state, for now we just redirect)
      navigate('/charge', { replace: true });
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    background: 'var(--input-bg)',
    color: 'var(--text-light)',
    outline: 'none',
    width: '100%',
    fontSize: '1rem',
    transition: 'border-color 0.3s'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div className="page-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div className="card w-full max-w-md mx-auto" style={{ 
        padding: '2.5rem', 
        borderRadius: '24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px -12px var(--shadow-color)',
        position: 'relative', zIndex: 1
      }}>
        
        <div className="text-center mb-8">
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome to OrionVolt! 🎉</h1>
          <p style={{ color: 'var(--text-muted)' }}>Let's set up your profile before you start charging.</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Personal Details */}
          <div>
            <label style={labelStyle}><User size={14} color="#3b82f6"/> Full Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}><Phone size={14} color="#10b981"/> Mobile Number</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ ...inputStyle, width: 'auto', background: 'var(--hover-bg-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                +91
              </div>
              <input 
                type="tel" 
                name="mobileNumber"
                placeholder="10-digit mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                style={inputStyle}
                maxLength="10"
                required
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-light)', margin: '0.5rem 0' }} />

          {/* Vehicle Details */}
          <div>
            <label style={labelStyle}><Car size={14} color="#8b5cf6"/> Primary Vehicle Type</label>
            <div style={{ position: 'relative' }}>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} style={{...inputStyle, appearance: 'none'}} required>
                <option value="">Select Type</option>
                <option value="two_wheeler">Two Wheeler</option>
                <option value="three_wheeler">Three Wheeler</option>
                <option value="four_wheeler">Four Wheeler</option>
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Vehicle Company</label>
            <div style={{ position: 'relative' }}>
              <select name="company" value={formData.company} onChange={handleChange} style={{...inputStyle, appearance: 'none'}} disabled={!formData.vehicleType} required>
                <option value="">Select Company</option>
                {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Vehicle Model</label>
            <div style={{ position: 'relative' }}>
              <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} style={{...inputStyle, appearance: 'none'}} disabled={!formData.company} required>
                <option value="">Select Model</option>
                {availableModels.map(m => <option key={m.id} value={m.id}>{m.model}</option>)}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Registration Number</label>
            <input 
              type="text" 
              name="registrationNumber"
              placeholder="e.g. AP16AB1234"
              value={formData.registrationNumber}
              onChange={handleChange}
              style={{...inputStyle, textTransform: 'uppercase'}}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.name || !formData.mobileNumber || !formData.vehicleId || !formData.registrationNumber}
            style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Saving...' : <><CheckCircle size={20} /> Save & Continue</>}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            You can update these details anytime from your Profile page.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
