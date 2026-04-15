import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

interface AppShellProps {
  children: ReactNode;
  contentClassName?: string;
}

const AppShell = ({ children, contentClassName }: AppShellProps) => {
  const { isAuthenticated, isAdmin, logout, usuario } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link className="app-shell__brand" to="/">
          <img src="/bravologo.png" alt="Bravo" />
        </Link>

        <nav className="app-shell__nav" aria-label="Navegacao principal">
          <NavLink
            className={({ isActive }) => `app-shell__nav-link${isActive ? " is-active" : ""}`}
            end
            to="/"
          >
            Inicio
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-shell__nav-link${isActive ? " is-active" : ""}`}
            to="/cardapio"
          >
            Cardapio
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-shell__nav-link${isActive ? " is-active" : ""}`}
            to="/reservas"
          >
            Reservas
          </NavLink>
          {isAdmin && (
            <NavLink
              className={({ isActive }) => `app-shell__nav-link${isActive ? " is-active" : ""}`}
              to="/admin"
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="app-shell__actions">
          {isAuthenticated ? (
            <>
              <Link className="btn btn--outline-gold btn--sm" to="/perfil">
                Meu Perfil
              </Link>
              <button className="btn btn--ghost btn--sm" onClick={logout} type="button">
                Sair
              </button>
            </>
          ) : (
            <Link className="btn btn--outline-gold btn--sm" to="/login">
              Login
            </Link>
          )}
        </div>
      </header>

      <main className={contentClassName ?? ""}>
        {children}
      </main>

      <footer className="app-shell__footer">
        <span className="app-shell__footer-brand">Bravo</span>
        <span className="app-shell__footer-text">Sistema de Gestao de Restaurante</span>
      </footer>
    </div>
  );
};

export default AppShell;
