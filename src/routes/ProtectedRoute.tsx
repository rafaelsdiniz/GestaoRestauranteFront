import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="route-status">
        <span className="route-status__spinner" />
        <p>Recuperando sua sessao...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
