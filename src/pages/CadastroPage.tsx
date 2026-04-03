import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { criarEndereco } from "../services/EnderecoService";
import { criarUsuario } from "../services/UsuarioService";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";
import { getErrorMessage } from "../utils/error";

const emptyAddress: EnderecoRequestDTO = {
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

const CadastroPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isReady } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cadastrarEnderecoInicial, setCadastrarEnderecoInicial] = useState(true);
  const [endereco, setEndereco] = useState<EnderecoRequestDTO>(emptyAddress);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timeout = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [navigate, sucesso]);

  if (isReady && isAuthenticated) {
    return <Navigate replace to="/pedidos" />;
  }

  const updateAddressField = <T extends keyof EnderecoRequestDTO>(
    field: T,
    value: EnderecoRequestDTO[T]
  ) => {
    setEndereco((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateAddress = () => {
    const requiredFields: Array<keyof EnderecoRequestDTO> = [
      "rua",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "cep",
    ];

    return requiredFields.every((field) => {
      const fieldValue = endereco[field];
      return typeof fieldValue === "string" && fieldValue.trim().length > 0;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (cadastrarEnderecoInicial && !validateAddress()) {
      setErro("Preencha todos os campos obrigatorios do endereco inicial.");
      return;
    }

    setIsSubmitting(true);

    try {
      const usuario = await criarUsuario({ nome, email, senha });

      if (cadastrarEnderecoInicial) {
        await criarEndereco(usuario.id, endereco);
      }

      setSucesso("Cadastro realizado com sucesso. Redirecionando para o login...");
      setNome("");
      setEmail("");
      setSenha("");
      setEndereco(emptyAddress);
    } catch (error) {
      setErro(
        getErrorMessage(
          error,
          "Nao foi possivel concluir o cadastro. Revise os dados e tente novamente."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell contentClassName="page page--auth">
      <section className="auth-layout auth-layout--wide">
        <article className="panel auth-panel auth-panel--highlight">
          <span className="kicker">Cadastro do cliente</span>
          <h1>Onboarding pronto para mostrar usuario e enderecos no mesmo fluxo.</h1>
          <p className="hero__lead">
            O formulario cria a conta e ainda pode registrar o primeiro endereco
            de entrega, alinhando o front com o requisito de multiplos enderecos.
          </p>

          <div className="hero__stats">
            <article className="stat-card">
              <strong>1 conta</strong>
              <span>base para pedidos, reservas e historico</span>
            </article>
            <article className="stat-card">
              <strong>N enderecos</strong>
              <span>fluxo preparado para delivery proprio e parceiros</span>
            </article>
          </div>
        </article>

        <form className="panel auth-panel auth-panel--form" onSubmit={handleSubmit}>
          <div className="panel__header">
            <div>
              <span className="kicker">Criar conta</span>
              <h2>Cadastro com perfil inicial</h2>
            </div>
          </div>

          <div className="form-grid form-grid--two">
            <label className="field">
              <span>Nome</span>
              <input
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome completo"
                required
                type="text"
                value={nome}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@codefood.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="field field--full">
              <span>Senha</span>
              <input
                minLength={6}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Minimo de 6 caracteres"
                required
                type="password"
                value={senha}
              />
            </label>
          </div>

          <label className="checkbox-field">
            <input
              checked={cadastrarEnderecoInicial}
              onChange={(event) => setCadastrarEnderecoInicial(event.target.checked)}
              type="checkbox"
            />
            <span>Ja cadastrar um endereco inicial de entrega</span>
          </label>

          {cadastrarEnderecoInicial ? (
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Rua</span>
                <input
                  onChange={(event) => updateAddressField("rua", event.target.value)}
                  placeholder="Rua das Hortas"
                  type="text"
                  value={endereco.rua}
                />
              </label>

              <label className="field">
                <span>Numero</span>
                <input
                  onChange={(event) => updateAddressField("numero", event.target.value)}
                  placeholder="123"
                  type="text"
                  value={endereco.numero}
                />
              </label>

              <label className="field">
                <span>Complemento</span>
                <input
                  onChange={(event) =>
                    updateAddressField("complemento", event.target.value)
                  }
                  placeholder="Apto, bloco, referencia"
                  type="text"
                  value={endereco.complemento ?? ""}
                />
              </label>

              <label className="field">
                <span>Bairro</span>
                <input
                  onChange={(event) => updateAddressField("bairro", event.target.value)}
                  placeholder="Centro"
                  type="text"
                  value={endereco.bairro}
                />
              </label>

              <label className="field">
                <span>Cidade</span>
                <input
                  onChange={(event) => updateAddressField("cidade", event.target.value)}
                  placeholder="Sao Paulo"
                  type="text"
                  value={endereco.cidade}
                />
              </label>

              <label className="field">
                <span>Estado</span>
                <input
                  maxLength={2}
                  onChange={(event) =>
                    updateAddressField("estado", event.target.value.toUpperCase())
                  }
                  placeholder="SP"
                  type="text"
                  value={endereco.estado}
                />
              </label>

              <label className="field field--full">
                <span>CEP</span>
                <input
                  onChange={(event) => updateAddressField("cep", event.target.value)}
                  placeholder="00000-000"
                  type="text"
                  value={endereco.cep}
                />
              </label>
            </div>
          ) : null}

          {erro ? <div className="message message--error">{erro}</div> : null}
          {sucesso ? <div className="message message--success">{sucesso}</div> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando conta..." : "Finalizar cadastro"}
          </button>

          <p className="auth-panel__footer">
            Ja tem conta? <Link to="/login">Entrar agora</Link>
          </p>
        </form>
      </section>
    </AppShell>
  );
};

export default CadastroPage;
