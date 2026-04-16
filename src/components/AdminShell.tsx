import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const AdminShell = () => {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <NavLink to="/admin">
            <img src="/bravologo.png" alt="Logo" className="admin-sidebar__logo-img" />
          </NavLink>
          <span className="admin-sidebar__role">Admin</span>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Navegacao admin">
          <span className="admin-sidebar__section">Principal</span>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin"
            end
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/pedidos"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Pedidos
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/reservas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Reservas
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/clientes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            Clientes
          </NavLink>

          <span className="admin-sidebar__section">Cardapio</span>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/cardapio"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Itens
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/ingredientes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Ingredientes
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/mesas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="3" rx="1"/><path d="M4 10v7"/><path d="M20 10v7"/><path d="M9 10v7"/><path d="M15 10v7"/></svg>
            Mesas
          </NavLink>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/sugestoes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
            Sugestao Chef
          </NavLink>

          <span className="admin-sidebar__section">Analise</span>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/relatorios"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Relatorios
          </NavLink>

          <span className="admin-sidebar__section">Sistema</span>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? " is-active" : ""}`}
            to="/admin/configuracoes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Configuracoes
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {(usuario?.nomeUsuario || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{usuario?.nomeUsuario || "Admin"}</strong>
              <span>{usuario?.email}</span>
            </div>
          </div>
          <div className="admin-sidebar__actions">
            <NavLink className="btn btn--ghost btn--sm" to="/">
              Ver site
            </NavLink>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout} type="button">
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminShell;
