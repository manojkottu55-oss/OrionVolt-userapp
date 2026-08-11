import React, { useState } from 'react';
import { Calendar, Clock, MapPin, X, CheckCircle, Zap } from 'lucide-react';

const mockKiosks = [
  { id: 'KS001', location: 'Mall Entrance', status: 'Available', estimatedFree: null },
  { id: 'KS002', location: 'Parking Block A', status: 'Occupied', estimatedFree: '4:30 PM' },
  { id: 'KS003', location: 'Food Court', status: 'Available', estimatedFree: null },
  { id: 'KS004', location: 'Gate 2', status: 'Occupied', estimatedFree: '5:15 PM' },
  { id: 'KS005', location: 'Block B', status: 'Available', estimatedFree: null },
  { id: 'KS006', location: 'EV Bay C', status: 'Occupied', estimatedFree: '6:00 PM' },
];

const mockInitialBookings = [
  { id: '#BK-001', kioskId: 'KS003', date: 'Today', time: '5:30 PM', duration: '30 min', vehicle: 'Ola S1 Pro', status: 'Upcoming' },
  { id: '#BK-002', kioskId: 'KS002', date: 'Tomorrow', time: '10:00 AM', duration: '1 hour', vehicle: 'Ather 450X', status: 'Cancelled' },
];

const SlotBooking = () => {
  const [kiosks] = useState(mockKiosks);
  const [bookings, setBookings] = useState(mockInitialBookings);
  const [modalData, setModalData] = useState(null); // null means closed, object means open
  const [toast, setToast] = useState(false);
  const [formData, setFormData] = useState({ duration: '30 min', vehicle: '' });

  const openModal = (kiosk) => {
    const isAvailable = kiosk.status === 'Available';
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Format time to HH:mm
    let formattedTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    // Quick mock conversion for occupied times
    if (!isAvailable && kiosk.estimatedFree) {
       if (kiosk.estimatedFree === '4:30 PM') formattedTime = '16:30';
       if (kiosk.estimatedFree === '5:15 PM') formattedTime = '17:15';
       if (kiosk.estimatedFree === '6:00 PM') formattedTime = '18:00';
    }

    setModalData({
      ...kiosk,
      date: formattedDate,
      time: formattedTime
    });
    setFormData({ duration: '30 min', vehicle: '' });
  };

  const closeModal = () => {
    setModalData(null);
  };

  const handleConfirm = () => {
    const newBooking = {
      id: `#BK-00${bookings.length + 1}`,
      kioskId: modalData.id,
      date: modalData.date,
      time: modalData.time,
      duration: formData.duration,
      vehicle: formData.vehicle || 'Unknown Vehicle',
      status: 'Upcoming'
    };
    
    setBookings([newBooking, ...bookings]);
    setModalData(null);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handleCancelBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  };

  return (
    <div className="page-content" style={{ padding: '2rem' }}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ margin: 0 }}>Book a Charging Slot</h1>
          <div className="text-muted text-sm mt-1">Check kiosk availability and reserve your charging time</div>
        </div>
        <Calendar size={28} color="var(--primary)" />
      </div>

      {/* KIOSK GRID */}
      <div className="kiosk-grid">
        {kiosks.map((kiosk) => (
          <div key={kiosk.id} className={`card kiosk-card ${kiosk.status}`} style={{ 
            padding: '1.25rem', 
            marginBottom: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            borderTop: `3px solid ${kiosk.status === 'Available' ? 'var(--primary)' : 'var(--danger)'}`,
            transition: 'all 0.3s ease',
          }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={18} color="var(--primary)" /> {kiosk.id}
                </h3>
                <div className="text-muted text-sm flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {kiosk.location}
                </div>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '99px',
                backgroundColor: kiosk.status === 'Available' ? 'var(--primary)' : 'var(--danger)',
                color: 'white'
              }}>
                {kiosk.status}
              </span>
            </div>

            {kiosk.status === 'Occupied' && (
              <div className="text-muted text-sm mb-4 flex items-center gap-1">
                <Clock size={14} /> Free at ~{kiosk.estimatedFree}
              </div>
            )}
            
            <div style={{ marginTop: 'auto', paddingTop: kiosk.status === 'Available' ? '1.5rem' : '0' }}>
              <button 
                className={`btn ${kiosk.status === 'Available' ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '99px' }}
                onClick={() => openModal(kiosk)}
              >
                {kiosk.status === 'Available' ? 'Book Now' : 'Schedule'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MY BOOKINGS */}
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>My Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '2rem', backgroundColor: 'var(--hover-bg)', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
            No bookings yet. Reserve a slot above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((booking) => (
              <div key={booking.id} className="card" style={{ padding: '1.25rem', marginBottom: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontWeight: 600, color: 'var(--text-light)' }}>{booking.kioskId}</span>
                    <span className="text-muted text-sm">({booking.id})</span>
                  </div>
                  <div className="text-muted text-sm flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {booking.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {booking.time}</span>
                  </div>
                  <div className="text-muted text-sm mt-1">
                    {booking.duration} • {booking.vehicle}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '99px',
                    backgroundColor: booking.status === 'Upcoming' ? 'var(--primary-alpha)' : 'var(--danger-alpha)',
                    color: booking.status === 'Upcoming' ? 'var(--primary)' : 'var(--danger)'
                  }}>
                    {booking.status}
                  </span>
                  
                  {booking.status === 'Upcoming' && (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--danger)', 
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalData && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--shadow-color)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }} 
          onClick={closeModal}
        >
          <div 
            className="card modal-content" 
            style={{ width: '100%', maxWidth: '450px', padding: '2rem', margin: 0, position: 'relative' }}
            onClick={e => e.stopPropagation()} // Prevent click outside
          >
            <button 
              onClick={closeModal}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
              {modalData.status === 'Available' ? 'Book Slot' : 'Schedule Slot'} — {modalData.id}
            </h2>
            <div className="text-muted text-sm mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1"><MapPin size={14}/> {modalData.location}</span>
              <span style={{ color: modalData.status === 'Available' ? 'var(--primary)' : 'var(--danger)' }}>
                {modalData.status}
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={modalData.date} 
                onChange={e => setModalData({...modalData, date: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Time</label>
              <input 
                type="time" 
                className="input-field" 
                value={modalData.time} 
                onChange={e => setModalData({...modalData, time: e.target.value})}
              />
              {modalData.status === 'Occupied' && (
                <div className="text-muted text-sm mt-1" style={{ fontSize: '0.75rem' }}>Estimated free at {modalData.estimatedFree}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Duration</label>
              <select 
                className="input-field" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              >
                <option value="15 min">15 min</option>
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="1 hour">1 hour</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Vehicle</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Ola S1 Pro"
                value={formData.vehicle}
                onChange={e => setFormData({...formData, vehicle: e.target.value})}
              />
            </div>

            <div className="flex gap-4">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirm}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--primary)',
          borderRadius: '0.5rem',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px var(--shadow-color)',
          color: 'var(--text-light)',
          zIndex: 2000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <CheckCircle size={20} color="var(--primary)" />
          Slot booked successfully!
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .kiosk-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        @media (min-width: 1024px) {
          .kiosk-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .kiosk-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .kiosk-grid { grid-template-columns: 1fr; }
        }
        .kiosk-card:hover {
          box-shadow: 0 0 15px var(--primary-alpha);
          transform: translateY(-2px);
        }
        .kiosk-card.Occupied:hover {
          box-shadow: 0 0 15px var(--danger-alpha);
        }
      `}} />
    </div>
  );
};

export default SlotBooking;
