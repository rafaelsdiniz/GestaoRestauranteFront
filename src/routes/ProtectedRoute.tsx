import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <Loader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
