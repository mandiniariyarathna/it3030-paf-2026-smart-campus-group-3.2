import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute() {
  const { isAuthenticated, isInitializing, isAdmin } = useAuth();

  if (isInitializing) {
    return <p className="page-loader">Checking access...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
}

export default AdminRoute;
