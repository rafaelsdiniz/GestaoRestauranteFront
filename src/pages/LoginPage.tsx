import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { getErrorMessage } from "../utils/error";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isReady, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isReady && isAuthenticated) {
    return <Navigate replace to={isAdmin ? "/admin" : "/"} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setIsSubmitting(true);

    try {
      const response = await login({ email, senha });
      const userIsAdmin = response.admin === true || response.tipoUsuario === "Administrador";
      navigate(userIsAdmin ? "/admin" : "/", { replace: true });
    } catch (error) {
      setErro(
        getErrorMessage(
          error,
          "Nao foi possivel entrar. Confira email, senha e a conexao com a API."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell contentClassName="page page--auth">
      <section className="auth-layout">
        <article className="panel auth-panel auth-panel--highlight">
          <span className="kicker">Bem-vindo de volta</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 600, lineHeight: 1.2 }}>Entre para acessar pedidos, reservas e mais.</h1>
          <p className="hero__lead">
            Faca login para montar pedidos, reservar mesas e acompanhar
            seu historico no Bravo.
          </p>

          <div className="auth-panel__brand">
            <img src="/bravologo.png" alt="Bravo" />
          </div>
        </article>

        <form className="panel auth-panel auth-panel--form" onSubmit={handleSubmit}>
          <div className="panel__header">
            <div>
              <span className="kicker">Acesso autenticado</span>
              <h2>Entrar com sua conta</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@bravo.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                required
                type="password"
                value={senha}
              />
            </label>
          </div>

          {erro ? <div className="message message--error">{erro}</div> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Acessar painel"}
          </button>

          <p className="auth-panel__footer">
            Ainda nao tem conta? <Link to="/cadastro">Criar cadastro agora</Link>
          </p>
        </form>
      </section>
    </AppShell>
  );
};

export default LoginPage;
