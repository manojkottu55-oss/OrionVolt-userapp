import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// ── Attach Supabase access token to every request ──
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Silently continue — backend will reject if auth is required
    console.warn('[OrionVolt] Could not attach auth token:', err.message);
  }
  return config;
});

// ── Mock data fallback when backend is offline ──
const MOCK_DATA = {
  '/auth/otp/request': { success: true, message: 'OTP sent (demo mode)' },
  '/auth/otp/verify': { success: true, token: 'demo-jwt-token-orionvolt-2026' },
  '/kiosk-qr/redeem': { success: true, message: 'Kiosk linked (demo mode)' },
  '/signin/session': {
    success: true,
    session: {
      sessionId: 'DEMO-SESSION-001',
      kioskId: 'KSK001',
      status: 'pending',
      vehicleType: '2_wheeler',
      estimatedAmount: 120,
    }
  },
  '/vehicles': {
    success: true,
    vehicles: [
      { _id: 'v1', make: 'Ola', model: 'S1 Pro', type: 'two_wheeler', batteryCapacityKwh: 3.97 },
      { _id: 'v2', make: 'Ather', model: '450X', type: 'two_wheeler', batteryCapacityKwh: 3.7 },
      { _id: 'v3', make: 'Tata', model: 'Nexon EV', type: 'four_wheeler', batteryCapacityKwh: 40.5 },
    ]
  },
  '/history': {
    success: true,
    sessions: [
      {
        _id: '1',
        kioskId: 'KSK001',
        status: 'completed',
        energyDispensed: 3.45,
        estimatedAmount: 120,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: '2',
        kioskId: 'KSK003',
        status: 'completed',
        energyDispensed: 5.12,
        estimatedAmount: 185,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        _id: '3',
        kioskId: 'KSK002',
        status: 'charging',
        energyDispensed: 1.80,
        estimatedAmount: 95,
        createdAt: new Date().toISOString(),
      },
    ]
  }
};

// Resolve mock data for a given URL
function getMockResponse(url, method) {
  // Exact match
  for (const key of Object.keys(MOCK_DATA)) {
    if (url.endsWith(key)) {
      return { data: MOCK_DATA[key] };
    }
  }
  // Dynamic session endpoints
  if (url.includes('/signin/session/') && url.endsWith('/pay')) {
    return { data: { success: true, paymentLink: null, qrCode: null, amount: 120 } };
  }
  if (url.includes('/signin/session/')) {
    return {
      data: {
        success: true,
        session: {
          sessionId: 'DEMO-SESSION-001',
          kioskId: 'KSK001',
          status: 'completed',
          vehicleType: '2_wheeler',
          estimatedAmount: 120,
          energyDispensed: 3.45,
          durationElapsed: 45,
        }
      }
    };
  }
  // Default fallback
  return { data: { success: true, message: 'Demo mode — backend offline' } };
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a network error (backend offline), return mock data
    if (!error.response || error.code === 'ERR_NETWORK') {
      const url = error.config?.url || '';
      const method = error.config?.method || 'get';
      console.warn(`[OrionVolt] Backend offline — returning mock data for: ${method.toUpperCase()} ${url}`);
      return Promise.resolve(getMockResponse(url, method));
    }
    return Promise.reject(error);
  }
);

export default api;
