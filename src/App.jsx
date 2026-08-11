import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Charge from './pages/Charge';
import Payment from './pages/Payment';
import UpiPayment from './pages/UpiPayment';
import Status from './pages/Status';
import History from './pages/History';
import Payments from './pages/Payments';
import Refunds from './pages/Refunds';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import SlotBooking from './pages/SlotBooking';
import GreenScore from './pages/GreenScore';
import Settings from './pages/Settings';
import ClickSpark from './components/ClickSpark';

// Stubs for upcoming pages
const Support = () => <div style={{ padding: '2rem' }}>Support (Coming Soon)</div>;

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

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/kiosk/:id" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes inside persistent Layout */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/charge" element={<Charge />} />
          <Route path="/slot-booking" element={<SlotBooking />} />
          <Route path="/green-score" element={<GreenScore />} />
          <Route path="/history" element={<History />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/upi-payment/:id" element={<UpiPayment />} />
          <Route path="/status/:id" element={<Status />} />
          <Route path="/" element={<Navigate to="/charge" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ClickSpark sparkColor="#fafafa" sparkSize={10} sparkRadius={15} sparkCount={7} duration={400}>
          <AppRoutes />
        </ClickSpark>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
