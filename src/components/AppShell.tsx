import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

interface AppShellProps {
  children: ReactNode;
  contentClassName?: string;
}

const navigationItems = [
  { to: "/", label: "Cardapio", end: true },
  { to: "/pedidos", label: "Pedidos" },
  { to: "/reservas", label: "Reservas" },
  { to: "/admin", label: "Admin" },
];

const AppShell = ({ children, contentClassName }: AppShellProps) => {
  const { isAuthenticated, logout, usuario } = useAuth();

  return (
    <div className="app-shell">
      <div className="app-shell__ambient app-shell__ambient--blue" />
      <div className="app-shell__ambient app-shell__ambient--amber" />
      <div className="app-shell__ambient app-shell__ambient--red" />

      <header className="app-shell__header">
        <Link className="app-shell__brand" to="/">
          <img src="/codefood.png" alt="CodeFood" />

          <div>
            <strong>CodeFood</strong>
            <span>Gestao de restaurante com cara de entrega final</span>
          </div>
        </Link>

        <nav className="app-shell__nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? " is-active" : ""}`
              }
              end={item.end}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__actions">
          {isAuthenticated ? (
            <>
              <div className="app-shell__user">
                <span>Conectado como</span>
                <strong>{usuario?.nomeUsuario ?? "Cliente"}</strong>
              </div>

              <button
                className="button button--ghost"
                onClick={logout}
                type="button"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className="button button--ghost" to="/login">
                Entrar
              </Link>

              <Link className="button button--primary" to="/cadastro">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={`app-shell__content ${contentClassName ?? ""}`}>
        {children}
      </main>

      <footer className="app-shell__footer">
        <p>CodeFood | A1 de Topicos II | Frontend React + Vite</p>
        <p>Cardapio, pedidos, reservas, sugestao do chefe e relatorios.</p>
      </footer>
    </div>
  );
};

export default AppShell;
