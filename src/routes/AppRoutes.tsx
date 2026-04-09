import { Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminShell from "../components/AdminShell";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import CadastroPage from "../pages/CadastroPage";
import CardapioPage from "../pages/CardapioPage";
import PedidoPage from "../pages/PedidoPage";
import ReservaPage from "../pages/ReservaPage";
import EnderecoPage from "../pages/EnderecoPage";
import AdminPage from "../pages/AdminPage";
import IngredientePage from "../pages/IngredientePage";
import MesaPage from "../pages/MesaPage";
import SugestaoChefePage from "../pages/SugestaoChefePage";

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<CadastroPage />} />
    <Route path="/cardapio" element={<CardapioPage />} />

    {/* Client protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/pedidos" element={<PedidoPage />} />
      <Route path="/reservas" element={<ReservaPage />} />
      <Route path="/enderecos" element={<EnderecoPage />} />
    </Route>

    {/* Admin protected routes with sidebar layout */}
    <Route element={<AdminRoute />}>
      <Route element={<AdminShell />}>
        <Route path="/admin" element={<AdminPage section="dashboard" />} />
        <Route path="/admin/pedidos" element={<AdminPage section="pedidos" />} />
        <Route path="/admin/reservas" element={<AdminPage section="reservas" />} />
        <Route path="/admin/clientes" element={<AdminPage section="clientes" />} />
        <Route path="/admin/cardapio" element={<CardapioPage noShell />} />
        <Route path="/admin/ingredientes" element={<IngredientePage noShell />} />
        <Route path="/admin/mesas" element={<MesaPage noShell />} />
        <Route path="/admin/sugestoes" element={<AdminPage section="sugestoes" />} />
        <Route path="/admin/relatorios" element={<AdminPage section="relatorios" />} />
      </Route>
    </Route>

    {/* Public views of admin-only pages (these still use AppShell) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/sugestoes-chef" element={<SugestaoChefePage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
