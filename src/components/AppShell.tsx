import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { getHorariosPublicos, type HorariosPublicosDTO } from "../services/ConfiguracaoService";

interface AppShellProps {
  children: ReactNode;
  contentClassName?: string;
}

const defaultHorarios: HorariosPublicosDTO = {
  almocoInicio: "11:00",
  almocoFim: "14:00",
  jantarInicio: "18:00",
  jantarFim: "22:00",
  reservaInicio: "11:00",
  reservaFim: "14:00",
  antecedenciaMinimaDias: 1,
};

const AppShell = ({ children, contentClassName }: AppShellProps) => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [horarios, setHorarios] = useState<HorariosPublicosDTO>(defaultHorarios);

  useEffect(() => {
    let mounted = true;
    getHorariosPublicos()
      .then((h) => { if (mounted) setHorarios(h); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

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
        <div className="footer__inner">
          <div className="footer__col footer__col--brand">
            <img src="/bravologo.png" alt="Bravo" className="footer__logo" />
            <p className="footer__tagline">
              Corte perfeito, sabor perfeito. Gastronomia com ingredientes
              selecionados e cortes que fazem a diferenca.
            </p>
            <div className="footer__socials">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.08 4.08 0 011.47.957c.453.453.757.91.957 1.47.163.46.35 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.08 4.08 0 01-.957 1.47 4.08 4.08 0 01-1.47.957c-.46.163-1.26.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.08 4.08 0 01-1.47-.957 4.08 4.08 0 01-.957-1.47c-.163-.46-.35-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.08 4.08 0 01.957-1.47A4.08 4.08 0 015.063 2.293c.46-.163 1.26-.35 2.43-.403C8.759 1.832 9.139 1.82 12 1.82h.343M12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.88 5.88 0 001.384 2.126 5.88 5.88 0 002.126 1.384c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.297-.763.499-1.635.558-2.913C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.163 6.163 0 100 12.325 6.163 6.163 0 000-12.325zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Navegacao</h4>
            <ul className="footer__links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/cardapio">Cardapio</Link></li>
              <li><Link to="/reservas">Reservas</Link></li>
              {isAuthenticated && <li><Link to="/pedidos">Meus Pedidos</Link></li>}
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Horarios</h4>
            <ul className="footer__info">
              <li><strong>Almoco</strong> {horarios.almocoInicio} — {horarios.almocoFim}</li>
              <li><strong>Jantar</strong> {horarios.jantarInicio} — {horarios.jantarFim}</li>
              <li><strong>Reservas</strong> {horarios.reservaInicio} — {horarios.reservaFim}</li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Contato</h4>
            <ul className="footer__info">
              <li>(11) 99999-9999</li>
              <li>contato@bravo.com.br</li>
              <li>Rua da Gastronomia, 123<br />Sao Paulo — SP</li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} Bravo Restaurante. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
