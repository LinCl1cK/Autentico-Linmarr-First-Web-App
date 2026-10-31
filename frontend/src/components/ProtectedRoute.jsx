import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, getToken } from '../api/client';
import { isAdmin } from '../utils/userDisplay';

export function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

// Only lets ADMIN users through. The backend still enforces this too (403).
export function AdminRoute({ children }) {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin(getStoredUser()?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicOnly({ children }) {
  if (getToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
