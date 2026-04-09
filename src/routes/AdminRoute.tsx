import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/useAuth";

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, isReady } = useAuth();

  if (!isReady) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
