import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Sessions from './pages/Sessions';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Resources from './pages/Resources';
import Webinars from './pages/Webinars';
import Quizzes from './pages/Quizzes';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="patients" element={<Patients />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="finance" element={<Finance />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="resources" element={<Resources />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="webinars" element={<Webinars />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
