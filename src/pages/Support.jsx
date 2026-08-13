import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, ChevronDown, ChevronUp, FileText, Shield, Loader2, CheckCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import api from '../api';

const SUPPORT_EMAIL = "support@orionvolt.com";
const SUPPORT_PHONE = "+91 9381148931";
const WHATSAPP_NUMBER = "919381148931";

const faqs = [
  { q: "How do I start charging my EV?", a: "Connect the charger to your EV, select your vehicle and charging amount in the app, and tap 'Start Charging'. The session will automatically stop when the target is reached." },
  { q: "What payment methods are accepted?", a: "We accept UPI, Credit/Debit Cards, Net Banking, and Wallet payments through our secure Razorpay gateway." },
  { q: "How do refunds work if charging stops early?", a: "If you stop a session early, or if there's a power interruption, the unutilized amount is instantly refunded to your original payment method. It usually reflects within 5-7 working days." },
  { q: "Can I book a charging slot in advance?", a: "Yes! You can use the 'Slot Booking' page to reserve a specific kiosk for an upcoming date and time." },
  { q: "What is the Green Score and how do I earn points?", a: "Green Score rewards you for charging with OrionVolt. You earn points for every kWh charged, which can be redeemed for charging credits or exclusive offers." },
  { q: "My charging session got interrupted, what do I do?", a: "Check your vehicle's connection. If power was lost on our end, your session will automatically halt and you will be refunded for the unused portion. You can start a new session once power is restored." },
  { q: "How do I update my vehicle details?", a: "Go to your Profile page. You can add new vehicles, remove old ones, and select your primary vehicle to make charging even faster." },
  { q: "Is my payment information secure?", a: "Absolutely. We do not store your credit card or UPI details on our servers. All transactions are securely processed by Razorpay." }
];

const Support = () => {
  const { profile } = useProfile();
  
  const [activeFaq, setActiveFaq] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [expandedDocs, setExpandedDocs] = useState({
    terms: false,
    privacy: false
  });

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || ''
      }));
    }
  }, [profile]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/support/ticket', form);
      setSuccess(true);
      setForm(prev => ({ ...prev, subject: '', message: '' }));
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setError('Failed to send message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const toggleDoc = (doc) => {
    setExpandedDocs(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  return (
    <div className="page-content pb-12">
      {/* HEADER */}
      <div className="flex flex-col items-center justify-center gap-2 mb-10 text-center">
        <h1 style={{
          marginBottom: 0, fontSize: '2.5rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Help & Support</h1>
        <p className="subtitle max-w-lg mx-auto" style={{ fontSize: '1.1rem' }}>
          We're here to help you with anything related to charging, payments, or your account
        </p>
      </div>

      {/* QUICK CONTACT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <a href={`tel:${SUPPORT_PHONE}`} className="card support-card group" style={cardStyle}>
          <div style={iconBadgeStyle('var(--primary)')}>
            <Phone size={24} color="var(--primary)" />
          </div>
          <h3 style={cardTitleStyle}>Call Support</h3>
          <p style={cardPrimaryTextStyle}>{SUPPORT_PHONE}</p>
          <p style={cardSubTextStyle}>Mon-Sun, 9 AM - 9 PM</p>
        </a>

        <a href={`mailto:${SUPPORT_EMAIL}`} className="card support-card group" style={cardStyle}>
          <div style={iconBadgeStyle('var(--primary)')}>
            <Mail size={24} color="var(--primary)" />
          </div>
          <h3 style={cardTitleStyle}>Email Us</h3>
          <p style={cardPrimaryTextStyle}>{SUPPORT_EMAIL}</p>
          <p style={cardSubTextStyle}>Response within 24 hours</p>
        </a>

        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20OrionVolt%20Support,%20I%20need%20help%20with`} target="_blank" rel="noreferrer" className="card support-card group" style={cardStyle}>
          <div style={iconBadgeStyle('#25D366')}>
            <MessageCircle size={24} color="#25D366" />
          </div>
          <h3 style={cardTitleStyle}>Chat on WhatsApp</h3>
          <p style={{...cardPrimaryTextStyle, color: '#25D366'}}>Quick response</p>
          <p style={cardSubTextStyle}>Instant messaging</p>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* FAQ SECTION */}
        <div>
          <h2 style={sectionTitleStyle}>Frequently Asked Questions</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="card"
                style={{
                  ...faqCardStyle,
                  borderColor: activeFaq === idx ? 'var(--primary)' : 'var(--border-light)'
                }}
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  style={faqButtonStyle}
                >
                  <span style={{ fontWeight: 600, color: activeFaq === idx ? 'var(--primary)' : 'var(--text-light)', textAlign: 'left' }}>
                    {faq.q}
                  </span>
                  <div style={{
                    transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: activeFaq === idx ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                <div style={{
                  maxHeight: activeFaq === idx ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  opacity: activeFaq === idx ? 1 : 0
                }}>
                  <p style={{ padding: '0 1.25rem 1.25rem 1.25rem', margin: 0, color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT FORM */}
        <div>
          <h2 style={sectionTitleStyle}>Still need help? Send us a message</h2>
          <form onSubmit={handleSubmit} className="card p-6" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            
            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            
            {success ? (
              <div style={{ display: 'flex', flexDirection: 'col', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
                <CheckCircle size={48} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)' }}>Message sent!</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>We'll get back to you soon.</p>
                </div>
                <button type="button" onClick={() => setSuccess(false)} className="btn btn-outline mt-4">Send another message</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleFormChange} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleFormChange} style={inputStyle} required />
                  </div>
                </div>
                
                <div>
                  <label style={labelStyle}>Subject</label>
                  <select name="subject" value={form.subject} onChange={handleFormChange} style={inputStyle} required>
                    <option value="">Select a subject...</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Charging Issue">Charging Issue</option>
                    <option value="Booking Issue">Booking Issue</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea name="message" value={form.message} onChange={handleFormChange} style={{...inputStyle, minHeight: '120px', resize: 'vertical'}} required></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-2" disabled={submitting} style={{ height: '50px' }}>
                  {submitting ? <><Loader2 size={20} className="spin" /> Sending...</> : 'Send Message'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* POLICIES */}
      <div className="flex flex-col gap-4 mb-16">
        <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <button onClick={() => toggleDoc('terms')} style={docButtonStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <FileText size={20} color="var(--primary)" /> Read Terms & Conditions
            </div>
            {expandedDocs.terms ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
          </button>
          
          <div style={{
            maxHeight: expandedDocs.terms ? '400px' : '0',
            overflowY: 'auto',
            transition: 'max-height 0.3s ease',
            padding: expandedDocs.terms ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Acceptance of Terms</h4>
            <p>By accessing and using the OrionVolt platform, you agree to be bound by these Terms and Conditions.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Service Description</h4>
            <p>OrionVolt provides access to an EV charging network, allowing users to locate, book, and pay for charging sessions.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>User Responsibilities</h4>
            <p>Users must provide accurate information, maintain the security of their account, and use the charging stations responsibly without causing damage.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Payment & Refund Policy</h4>
            <p>Payments are processed securely via Razorpay. If a session is terminated early, any unused funds will be automatically refunded within 5-7 business days.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Charging Session Rules</h4>
            <p>Users must vacate the charging bay promptly after their session ends. Overstaying may result in idle fees or account suspension.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Limitation of Liability</h4>
            <p>OrionVolt is not liable for indirect, incidental, or consequential damages arising from the use of our services or failure of charging equipment.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Account Termination</h4>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities.</p>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <button onClick={() => toggleDoc('privacy')} style={docButtonStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <Shield size={20} color="var(--primary)" /> Read Privacy Policy
            </div>
            {expandedDocs.privacy ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
          </button>
          
          <div style={{
            maxHeight: expandedDocs.privacy ? '400px' : '0',
            overflowY: 'auto',
            transition: 'max-height 0.3s ease',
            padding: expandedDocs.privacy ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Information We Collect</h4>
            <p>We collect your name, mobile number, vehicle details, payment info, and location data when you use our kiosks or app.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>How We Use Your Information</h4>
            <p>Your information is used to provide charging services, process payments, and improve your user experience.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Data Sharing</h4>
            <p>We do not sell your personal data. We only share necessary information with our payment gateway partner, Razorpay, for processing transactions.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Data Security</h4>
            <p>We implement strict security measures to protect your data from unauthorized access, alteration, or disclosure.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Your Rights</h4>
            <p>You have the right to access, update, or request deletion of your personal data at any time via your Profile page or by contacting support.</p>
            
            <h4 style={{ color: 'var(--text)', marginTop: '1rem' }}>Contact for Privacy Concerns</h4>
            <p>If you have any privacy-related questions, please contact us at {SUPPORT_EMAIL}.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>OrionVolt © 2026. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => { toggleDoc('terms'); window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>Terms</button>
          <span>|</span>
          <button onClick={() => { toggleDoc('privacy'); window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>Privacy</button>
          <span>|</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
        </div>
      </div>

    </div>
  );
};

// Inline Styles
const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid var(--border-light)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  textDecoration: 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  cursor: 'pointer'
};

const iconBadgeStyle = (color) => ({
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: `color-mix(in srgb, ${color} 15%, transparent)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem'
});

const cardTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--text-light)',
  margin: '0 0 0.25rem 0'
};

const cardPrimaryTextStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text)',
  margin: '0 0 0.25rem 0'
};

const cardSubTextStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  margin: 0
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: '1.5rem'
};

const faqCardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '12px',
  border: '1px solid var(--border-light)',
  overflow: 'hidden',
  transition: 'border-color 0.3s ease'
};

const faqButtonStyle = {
  width: '100%',
  padding: '1.25rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer'
};

const docButtonStyle = {
  width: '100%',
  padding: '1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  background: 'var(--input-bg)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-light)',
  outline: 'none',
  fontSize: '1rem'
};

export default Support;
