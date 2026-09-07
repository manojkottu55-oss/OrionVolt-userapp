import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Zap, Map as MapIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Custom icons based on status
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="
      background-color: #3b82f6; /* Blue for user */
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4), 0 3px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const getStatusColor = (status) => {
  if (status === 'Available' || status === 'online') return 'var(--primary, #10b981)';
  if (status === 'Occupied' || status === 'charging') return 'var(--danger, #ef4444)';
  return 'var(--text-muted, #9ca3af)'; // Offline or Fault
};

// Component to recenter map when user location is found
const LocationMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

const KioskMapPage = () => {
  const [kiosks, setKiosks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const defaultCenter = [12.9716, 77.5946]; // Default to Bengaluru if no user location

  useEffect(() => {
    const fetchKiosks = async () => {
      try {
        const res = await api.get('/kiosks');
        if (res.data && res.data.kiosks) {
          setKiosks(res.data.kiosks);
        }
      } catch (err) {
        console.error('Failed to load kiosks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKiosks();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation denied or error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  const handleBook = (kiosk) => {
    navigate('/slot-booking');
  };

  return (
    <div className="page-content" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ margin: 0 }}>Find a Kiosk</h1>
          <div className="text-muted text-sm mt-1">Locate nearby OrionVolt charging stations</div>
        </div>
        <MapIcon size={28} color="var(--primary)" />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', height: '65vh', minHeight: '400px', marginBottom: '2rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Loading map...
          </div>
        ) : (
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User Location */}
            {userLocation && <LocationMarker position={userLocation} />}

            {/* Kiosks */}
            {kiosks.map((kiosk) => {
              if (!kiosk.latitude || !kiosk.longitude) return null;
              
              const pos = [parseFloat(kiosk.latitude), parseFloat(kiosk.longitude)];
              const color = getStatusColor(kiosk.status);
              const isAvailable = kiosk.status === 'Available' || kiosk.status === 'online';

              return (
                <Marker key={kiosk.kiosk_id} position={pos} icon={createIcon(color)}>
                  <Popup className="kiosk-popup">
                    <div style={{ minWidth: '150px' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem' }}>
                        <Zap size={16} color={color} /> {kiosk.kiosk_id}
                      </h3>
                      <div style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> {kiosk.location || kiosk.name}
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '99px',
                          backgroundColor: color,
                          color: 'white',
                          textTransform: 'capitalize'
                        }}>
                          {kiosk.status}
                        </span>
                      </div>
                      
                      <button 
                        className={`btn ${isAvailable ? 'btn-primary' : 'btn-outline'}`}
                        style={{ 
                          width: '100%', 
                          padding: '0.4rem', 
                          borderRadius: '99px', 
                          fontSize: '0.875rem',
                          border: isAvailable ? 'none' : '1px solid var(--border)' 
                        }}
                        onClick={() => handleBook(kiosk)}
                      >
                        {isAvailable ? 'Book This Slot' : 'Schedule'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
        <style dangerouslySetInnerHTML={{__html: `
          .leaflet-popup-content-wrapper {
            background-color: var(--card-bg, #fff);
            color: var(--text-light, #000);
            border-radius: 0.75rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .leaflet-popup-tip {
            background-color: var(--card-bg, #fff);
          }
          .leaflet-container {
            font-family: inherit;
          }
        `}} />
      </div>
    </div>
  );
};

export default KioskMapPage;
