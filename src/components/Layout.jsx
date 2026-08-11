import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Zap, BatteryCharging, History, CreditCard, RotateCcw, MessageSquare, User, HelpCircle, LogOut, Calendar, Leaf, Menu, X, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { to: '/charge', icon: <BatteryCharging size={24} />, label: 'Charge' },
    { to: '/slot-booking', icon: <Calendar size={24} />, label: 'Slot Booking' },
    { 
      to: '/green-score', 
      icon: <Leaf size={24} color="#00e676" />, 
      label: 'Green Score'
    },
    { to: '/history', icon: <History size={24} />, label: 'History' },
    { to: '/payments', icon: <CreditCard size={24} />, label: 'Payments' },
    { to: '/refunds', icon: <RotateCcw size={24} />, label: 'Refunds' },
    { to: '/feedback', icon: <MessageSquare size={24} />, label: 'Feedback' },
    { to: '/profile', icon: <User size={24} />, label: 'Profile' },
    { to: '/settings', icon: <Settings size={24} />, label: 'Settings' },
    { to: '/support', icon: <HelpCircle size={24} />, label: 'Support' }
  ];

  return (
    <div className="layout-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <img src="/logo.jpeg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <h2>OrionVolt</h2>
        </div>
        <div className="mobile-kiosk-badge">
          KIOSK-00
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.jpeg" alt="OrionVolt Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          <h2>OrionVolt User</h2>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} 
              style={{ position: 'relative' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              <span style={{ flexGrow: 1 }}>{item.label}</span>
              {item.badge && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00e676',
                  boxShadow: '0 0 8px #00e676',
                  animation: 'pulseGlow 2s infinite'
                }} />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={24} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <button 
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 50,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-main)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 6px var(--shadow-color)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
