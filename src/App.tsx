import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Loader from "./components/Loader";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setSplash(false), 3000);
    return () => window.clearTimeout(t);
  }, []);

  if (splash) return <Loader />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;