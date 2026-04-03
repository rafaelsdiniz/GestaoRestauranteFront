import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { getErrorMessage } from "../utils/error";

const loginBenefits = [
  "Acesso rapido ao fluxo de pedidos por periodo.",
  "Reserva de jantar com validacao de horario e mesa.",
  "Painel administrativo com relatorios e sugestao do chefe.",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isReady, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isReady && isAuthenticated) {
    return <Navigate replace to="/pedidos" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setIsSubmitting(true);

    try {
      await login({ email, senha });
      navigate("/pedidos", { replace: true });
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
          <span className="kicker">Entrar na plataforma</span>
          <h1>Seu restaurante agora tem uma porta de entrada com presenca.</h1>
          <p className="hero__lead">
            O login libera os modulos protegidos do trabalho e conecta o usuario
            aos pedidos, reservas e administracao em uma navegacao fluida.
          </p>

          <div className="rule-list">
            {loginBenefits.map((benefit) => (
              <div className="rule-item" key={benefit}>
                <span className="rule-item__index" />
                <p>{benefit}</p>
              </div>
            ))}
          </div>

          <div className="auth-panel__brand">
            <img src="/codefood.png" alt="CodeFood" />
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
                placeholder="voce@codefood.com"
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
