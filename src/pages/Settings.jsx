import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Moon, Sun, Smartphone, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const toggleSwitchStyle = (checked) => ({
    position: 'relative',
    width: '44px',
    height: '24px',
    background: checked ? 'var(--primary)' : 'var(--input-bg)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  });

  const toggleKnobStyle = (checked) => ({
    position: 'absolute',
    top: '2px',
    left: checked ? '22px' : '2px',
    width: '20px',
    height: '20px',
    background: 'var(--text-inverse)',
    borderRadius: '50%',
    transition: 'left 0.3s ease',
    boxShadow: '0 2px 4px var(--shadow-color)'
  });

  const SettingRow = ({ icon: Icon, title, description, checked, onChange, color }) => (
    <div className="flex items-center justify-between" style={{
      padding: '1rem',
      background: 'var(--hover-bg-subtle)',
      borderRadius: '16px',
      border: '1px solid var(--border-light)',
      marginBottom: '12px'
    }}>
      <div className="flex items-center gap-4">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '40px', height: '40px', borderRadius: '12px',
          background: `rgba(${color}, 0.15)`, color: `rgb(${color})`
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '1rem' }}>{title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</div>
        </div>
      </div>
      <div style={toggleSwitchStyle(checked)} onClick={() => onChange(!checked)}>
        <div style={toggleKnobStyle(checked)}></div>
      </div>
    </div>
  );

  return (
    <div className="page-content pb-12" style={{ position: 'relative' }}>
      {/* Decorative Background Bloom */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      <div className="flex flex-col items-center justify-center gap-1 mb-8" style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{
          marginBottom: 0, fontSize: '2.5rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Settings</h1>
        <p className="subtitle text-center" style={{ fontSize: '1.1rem' }}>Manage your preferences and app behavior</p>
      </div>

      <div className="card max-w-2xl mx-auto" style={{ 
        padding: '2rem', 
        borderRadius: '24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px -12px var(--shadow-color)',
        position: 'relative', zIndex: 1
      }}>
        
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={20} color="var(--primary)" /> General Preferences
        </h3>

        <SettingRow 
          icon={Bell} 
          title="Push Notifications" 
          description="Receive alerts for charging updates and offers" 
          checked={notifications} 
          onChange={setNotifications}
          color="59, 130, 246"
        />

        <SettingRow 
          icon={isDarkMode ? Moon : Sun} 
          title="Appearance" 
          description={`Current mode: ${isDarkMode ? 'Dark Mode' : 'Light Mode'}`} 
          checked={isDarkMode} 
          onChange={toggleTheme}
          color="139, 92, 246"
        />

        <h3 style={{ fontSize: '1.2rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--primary)" /> Security
        </h3>

        <SettingRow 
          icon={Smartphone} 
          title="Biometric Login" 
          description="Use Face ID or Fingerprint to sign in" 
          checked={biometrics} 
          onChange={setBiometrics}
          color="16, 185, 129"
        />

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <button 
            onClick={logout}
            className="btn w-full flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-500/10"
            style={{ 
              padding: '1rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px',
              color: 'var(--danger)', border: '1px solid var(--danger)', background: 'var(--hover-bg-subtle)'
            }}
          >
            <LogOut size={20} /> Sign Out of All Devices
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
