import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminShell from "../components/AdminShell";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import CadastroPage from "../pages/CadastroPage";
import CardapioPage from "../pages/CardapioPage";
import PagamentoPage from "../pages/PagamentoPage";
import PedidoConfirmacaoPage from "../pages/PedidoConfirmacaoPage";
import PedidoAcompanhamentoPage from "../pages/PedidoAcompanhamentoPage";
import ReservaPage from "../pages/ReservaPage";
import ReservaConfirmacaoPage from "../pages/ReservaConfirmacaoPage";
import PerfilPage from "../pages/PerfilPage";
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

    {/* Redirect /pedidos to /cardapio */}
    <Route path="/pedidos" element={<Navigate to="/cardapio" replace />} />

    {/* Client protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/perfil" element={<PerfilPage />} />
      <Route path="/pedidos/pagamento" element={<PagamentoPage />} />
      <Route path="/pedidos/confirmacao" element={<PedidoConfirmacaoPage />} />
      <Route path="/pedidos/:id/acompanhamento" element={<PedidoAcompanhamentoPage />} />
      <Route path="/reservas" element={<ReservaPage />} />
      <Route path="/reservas/confirmacao" element={<ReservaConfirmacaoPage />} />
      <Route path="/enderecos" element={<Navigate to="/perfil" state={{ tab: "enderecos" }} replace />} />
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
