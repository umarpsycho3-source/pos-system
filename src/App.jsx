import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import DayEnd from './pages/DayEnd';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Reports from './pages/Reports';
import AdminShops from './pages/AdminShops';
import AdminLogin from './pages/AdminLogin';
import { SettingsProvider, useSettings } from './context/SettingsContext';

const AppContent = () => {
  const { isAuthenticated, loading } = useSettings();

  if (loading) {
    return <div style={{ padding: '2rem', color: 'white' }}>Loading POS data...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Admin (separate) */}
        <Route path="/admin/login" element={<div className="standalone-scroll"><AdminLogin /></div>} />
        <Route path="/admin/shops" element={<div className="standalone-scroll"><AdminShops /></div>} />

        {/* Shop login */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <div className="standalone-scroll"><Login /></div>} />

        {/* Shop app (requires shop auth) */}
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="app-container">
                <Sidebar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<><Header title="POS Terminal" /><POS /></>} />
                    <Route path="/dashboard" element={<><Header title="Dashboard" /><Dashboard /></>} />
                    <Route path="/inventory" element={<><Header title="Inventory" /><Inventory /></>} />
                    <Route path="/customers" element={<><Header title="Customers" /><Customers /></>} />
                    <Route path="/employees" element={<><Header title="Employees" /><Employees /></>} />
                    <Route path="/reports" element={<><Header title="Sales Reports" /><Reports /></>} />
                    <Route path="/day-end" element={<><Header title="Day End Shift" /><DayEnd /></>} />
                    <Route path="/settings" element={<><Header title="Settings" /><Settings /></>} />
                  </Routes>
                </main>
              </div>
            )
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
