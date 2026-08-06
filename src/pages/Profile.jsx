import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    address: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Initialize form with Google auth data if available, or fallbacks
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || ''
      }));
    } else {
      // Mock data if user context is missing (for local testing)
      setFormData({
        name: 'Demo User',
        email: 'demo.user@gmail.com',
        mobile: '+91 9988776655',
        age: '28',
        address: '123 Tech Park, Bangalore'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false); // reset saved status on edit
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call to save profile
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
    }, 1200);
  };

  const inputStyle = {
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
    fontSize: '1rem',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  };

  const labelStyle = {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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

  return (
    <div className="page-content pb-12" style={{ position: 'relative' }}>
      {/* Decorative Background Bloom */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div className="flex flex-col items-center justify-center gap-1 mb-8" style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{
          marginBottom: 0, fontSize: '2.5rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>My Profile</h1>
        <p className="subtitle text-center" style={{ fontSize: '1.1rem' }}>Manage your account details</p>
      </div>

      <div className="card max-w-md mx-auto" style={{ 
        padding: '2.5rem', 
        borderRadius: '24px',
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative', zIndex: 1
      }}>
        {user?.user_metadata?.avatar_url && (
          <div className="flex justify-center mb-8 relative">
            <div style={{
              position: 'relative',
              padding: '4px',
              background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}>
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-card)' }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          <div className="flex flex-col">
            <label style={labelStyle}>
              <IconWrapper color="59, 130, 246"><User size={14} /></IconWrapper> Full Name
            </label>
            <input 
              type="text" 
              name="name"
              className="input-focus-ring"
              style={inputStyle}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>
              <IconWrapper color="239, 68, 68"><Mail size={14} /></IconWrapper> Gmail / Email
            </label>
            <input 
              type="email" 
              name="email"
              className="input-focus-ring"
              style={{...inputStyle, background: 'rgba(255,255,255,0.01)', opacity: 0.6, cursor: user?.email ? 'not-allowed' : 'text'}}
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
              readOnly={!!user?.email} 
              title={user?.email ? "Email is managed by Google" : ""}
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>
              <IconWrapper color="16, 185, 129"><Phone size={14} /></IconWrapper> Mobile Number
            </label>
            <input 
              type="tel" 
              name="mobile"
              className="input-focus-ring"
              style={inputStyle}
              placeholder="+91 9999999999"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>
              <IconWrapper color="245, 158, 11"><Calendar size={14} /></IconWrapper> Age
            </label>
            <input 
              type="number" 
              name="age"
              className="input-focus-ring"
              style={inputStyle}
              placeholder="Enter your age"
              value={formData.age}
              onChange={handleChange}
              min="16"
              max="120"
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>
              <IconWrapper color="139, 92, 246"><MapPin size={14} /></IconWrapper> Address
            </label>
            <textarea 
              name="address"
              className="input-focus-ring"
              style={{...inputStyle, minHeight: '100px', resize: 'vertical'}}
              placeholder="Enter your full address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full mt-6 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ 
              padding: '1rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px',
              background: saved ? 'var(--success)' : 'var(--primary)',
              boxShadow: saved ? '0 10px 20px -10px var(--success)' : '0 10px 20px -10px var(--primary)'
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">Saving Profile...</span>
            ) : saved ? (
              <span className="flex items-center gap-2"><CheckCircle size={22} /> Profile Saved</span>
            ) : (
              <span className="flex items-center gap-2"><Save size={22} /> Save Changes</span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .input-focus-ring:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
      `}</style>
    </div>
  );
};

export default Profile;
