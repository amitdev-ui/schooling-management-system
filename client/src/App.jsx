import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import { PageLoader } from './components/Spinner';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Announcements from './pages/Announcements';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';

function RouteGuard({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageLoader label="Loading session…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
}

function NavigationListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => { if (e.detail) navigate(e.detail); };
    window.addEventListener('sms:navigate', handler);
    return () => window.removeEventListener('sms:navigate', handler);
  }, [navigate]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<GuardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<RouteGuard adminOnly><Students /></RouteGuard>} />
        <Route path="classes" element={<RouteGuard adminOnly><Classes /></RouteGuard>} />
        <Route path="subjects" element={<RouteGuard adminOnly><Subjects /></RouteGuard>} />
        <Route path="teachers" element={<RouteGuard adminOnly><Teachers /></RouteGuard>} />
        <Route path="fees" element={<RouteGuard adminOnly><Fees /></RouteGuard>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function GuardLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <NavigationListener />
            <AppRoutes />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
