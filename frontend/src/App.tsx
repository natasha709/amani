import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import FeesPage from './pages/FeesPage';
import PaymentsPage from './pages/PaymentsPage';
import AcademicsPage from './pages/AcademicsPage';
import SaccoPage from './pages/SaccoPage';
import CommunicationsPage from './pages/CommunicationsPage';
import SettingsPage from './pages/SettingsPage';
import StaffPage from './pages/StaffPage';
import SchoolsPage from './pages/SchoolsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.requiresPasswordChange && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  return <>{children}</>;
}

// Role-based route wrapper
function RoleRoute({ children, roles }: { children: React.ReactNode, roles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={
        <ProtectedRoute>
          <ResetPasswordPage />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="staff" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN']}>
            <StaffPage />
          </RoleRoute>
        } />
        <Route path="schools" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN']}>
            <SchoolsPage />
          </RoleRoute>
        } />

        {/* Financial routes - restricted to owners and admins */}
        <Route path="fees" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN', 'PARENT']}>
            <FeesPage />
          </RoleRoute>
        } />
        <Route path="payments" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN']}>
            <PaymentsPage />
          </RoleRoute>
        } />

        <Route path="academics" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN', 'TEACHER', 'PARENT']}>
            <AcademicsPage />
          </RoleRoute>
        } />
        <Route path="sacco" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN']}>
            <SaccoPage />
          </RoleRoute>
        } />
        <Route path="communications" element={<CommunicationsPage />} />
        <Route path="settings" element={
          <RoleRoute roles={['SCHOOL_OWNER', 'ADMIN']}>
            <SettingsPage />
          </RoleRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
