import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Charge from './pages/Charge';
import Payment from './pages/Payment';
import UpiPayment from './pages/UpiPayment';
import ChargingLive from './pages/ChargingLive';
import Status from './pages/Status';
import History from './pages/History';
import Payments from './pages/Payments';
import Refunds from './pages/Refunds';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import CompleteProfile from './pages/CompleteProfile';
import SlotBooking from './pages/SlotBooking';
import GreenScore from './pages/GreenScore';
import Settings from './pages/Settings';
import ClickSpark from './components/ClickSpark';

import Support from './pages/Support';

// Auth guard — uses Supabase session from AuthContext
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Profile guard — ensures profile is completed before accessing main app
const RequireProfile = ({ children }) => {
  const { profileCompleted, loading } = useProfile();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading Profile...
      </div>
    );
  }

  return profileCompleted ? children : <Navigate to="/complete-profile" replace />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/kiosk/:id" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Must be authenticated, but maybe hasn't completed profile yet */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/support" element={<Support />} />
          
          {/* Fully protected routes (Auth + Profile Completed) */}
          <Route element={<RequireProfile><Outlet /></RequireProfile>}>
            <Route path="/charge" element={<Charge />} />
            <Route path="/slot-booking" element={<SlotBooking />} />
            <Route path="/green-score" element={<GreenScore />} />
            <Route path="/history" element={<History />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/payment/:id" element={<Payment />} />
            <Route path="/upi-payment/:id" element={<UpiPayment />} />
            <Route path="/status/:id" element={<Status />} />
            <Route path="/charging/:sessionId" element={<ChargingLive />} />
            <Route path="/" element={<Navigate to="/charge" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ThemeProvider>
          <ClickSpark sparkColor="#fafafa" sparkSize={10} sparkRadius={15} sparkCount={7} duration={400}>
            <AppRoutes />
          </ClickSpark>
        </ThemeProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
