import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import CadastroPage from "../pages/CadastroPage";
import CardapioPage from "../pages/CardapioPage";
import ReservaPage from "../pages/ReservaPage";
import PedidoPage from "../pages/PedidoPage";
import AdminPage from "../pages/AdminPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/" element={<CardapioPage />} />

        {/* protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/reservas" element={<ReservaPage />} />
          <Route path="/pedidos" element={<PedidoPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
