import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <p className="page-loader">Loading your session...</p>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
