import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import TenantManagement from './pages/TenantManagement';
import UserManagement from './pages/UserManagement';
import SettingsPage from './pages/Settings';
import SystemSettings from './pages/SystemSettings';
import SecurityPage from './pages/SecurityPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TaxCalendar from './pages/TaxCalendar';
import DepartmentsPage from './pages/DepartmentsPage';
import MyExpenses from './pages/MyExpenses';
import ApprovalDashboard from './pages/ApprovalDashboard';
import FiscalPeriodsPage from './pages/FiscalPeriodsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogPage from './pages/AuditLogPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import LandingPage from './pages/LandingPage';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import CommandPalette from './components/Navigation/CommandPalette';
import TopBar from './components/Layout/TopBar';

const AppContent = ({ isDarkMode, toggleTheme }) => {
  const { isAuthenticated, loading, config, user } = useAuth();
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('isSidebarPinned');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('isSidebarPinned', JSON.stringify(isSidebarPinned));
  }, [isSidebarPinned]);

  if (loading) return null;

  return (
    <div className="app-container" key={config?.language}>
      {isAuthenticated && !user?.requirePasswordChange && (
        <Sidebar 
          onToggleTheme={toggleTheme} 
          theme={isDarkMode ? 'dark' : 'light'} 
          isPinned={isSidebarPinned}
          onTogglePin={() => setIsSidebarPinned(!isSidebarPinned)}
        />
      )}
      <main 
        className={isAuthenticated && !user?.requirePasswordChange ? `main-layout ${!isSidebarPinned ? 'full-width' : ''}` : ""} 
        style={!isAuthenticated || user?.requirePasswordChange ? {width: '100%'} : {}}
      >
        {isAuthenticated && !user?.requirePasswordChange && <TopBar isSidebarPinned={isSidebarPinned} />}
        {isAuthenticated && !user?.requirePasswordChange && <CommandPalette />}
        {isAuthenticated && <div className="bg-glow-top"></div>}
        {isAuthenticated && <div className="bg-glow-bottom"></div>}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={isAuthenticated ? <ChangePasswordPage /> : <LoginPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <LoginPage />} />
          <Route path="/tenants" element={isAuthenticated && user?.role === 'SuperAdmin' ? <TenantManagement /> : <Navigate to="/" />} />
          <Route path="/departments" element={isAuthenticated ? <DepartmentsPage /> : <LoginPage />} />
          <Route path="/users" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin' || user?.role === 'AreaLeader') ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="/calendar" element={isAuthenticated ? <TaxCalendar /> : <LoginPage />} />
          <Route path="/my-expenses" element={isAuthenticated ? <MyExpenses /> : <LoginPage />} />
          <Route path="/approvals" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin' || user?.role === 'AreaLeader') ? <ApprovalDashboard /> : <Navigate to="/" />} />
          <Route path="/fiscal-periods" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin') ? <FiscalPeriodsPage /> : <Navigate to="/" />} />
          <Route path="/analytics" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin' || user?.role === 'AreaLeader') ? <AnalyticsPage /> : <Navigate to="/" />} />
          <Route path="/audit" element={isAuthenticated && user?.role === 'SuperAdmin' ? <AuditLogPage /> : <Navigate to="/" />} />
          <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <LoginPage />} />
          <Route path="/settings" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin') ? <SettingsPage /> : <Navigate to="/" />} />
          <Route path="/system-settings" element={isAuthenticated && (user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin') ? <SystemSettings /> : <Navigate to="/" />} />
          <Route path="/security" element={isAuthenticated ? <SecurityPage /> : <LoginPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('isDarkMode', JSON.stringify(newMode));
  };

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
