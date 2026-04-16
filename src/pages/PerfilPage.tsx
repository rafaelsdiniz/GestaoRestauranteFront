import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { atualizarUsuario } from "../services/UsuarioService";
import {
  listarEnderecosDoUsuario,
  criarEndereco,
  atualizarEndereco,
  deletarEndereco,
} from "../services/EnderecoService";
import { listarPedidosDoUsuario, cancelarPedido } from "../services/PedidoService";
import { listarReservasDoUsuario, cancelarReserva } from "../services/ReservaService";
import type { Endereco } from "../types/Endereco";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";
import type { Pedido } from "../types/Pedido";
import type { Reserva } from "../types/Reserva";
import { StatusReserva } from "../types/enums/StatusReserva";
import { StatusPedido, labelStatusPedido, corStatusPedido } from "../types/enums/StatusPedido";
import { getErrorMessage } from "../utils/error";
import {
  formatAddress,
  formatCurrency,
  formatDateTime,
  getStatusReservaLabel,
  getTipoAtendimentoLabel,
} from "../utils/formatters";

type Tab = "dados" | "pedidos" | "reservas" | "enderecos";

const tabs: { value: Tab; label: string }[] = [
  { value: "dados", label: "Dados Pessoais" },
  { value: "pedidos", label: "Pedidos" },
  { value: "reservas", label: "Reservas" },
  { value: "enderecos", label: "Enderecos" },
];

const emptyAddress: EnderecoRequestDTO = {
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

const PerfilPage = () => {
  const { usuario, updateUsuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const usuarioId = usuario?.usuario?.id ?? usuario?.usuarioId;

  const initialTab = (location.state as { tab?: Tab } | null)?.tab ?? "dados";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // --- Dados Pessoais ---
  const [nome, setNome] = useState(usuario?.nomeUsuario ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaAntiga, setSenhaAntiga] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [dadosMsg, setDadosMsg] = useState({ error: "", success: "" });
  const [senhaMsg, setSenhaMsg] = useState({ error: "", success: "" });
  const [isSavingDados, setIsSavingDados] = useState(false);
  const [isSavingSenha, setIsSavingSenha] = useState(false);

  // --- Pedidos ---
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosLoaded, setPedidosLoaded] = useState(false);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [pedidosError, setPedidosError] = useState("");

  // --- Reservas ---
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasLoaded, setReservasLoaded] = useState(false);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [reservasError, setReservasError] = useState("");
  const [reservasSuccess, setReservasSuccess] = useState("");

  // --- Enderecos ---
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecosLoaded, setEnderecosLoaded] = useState(false);
  const [enderecosLoading, setEnderecosLoading] = useState(false);
  const [enderecosError, setEnderecosError] = useState("");
  const [enderecosSuccess, setEnderecosSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EnderecoRequestDTO>(emptyAddress);
  const [isSavingEndereco, setIsSavingEndereco] = useState(false);

  // Clear location state after reading tab
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  // Lazy load pedidos
  useEffect(() => {
    if (activeTab !== "pedidos" || pedidosLoaded || !usuarioId) return;
    let mounted = true;
    setPedidosLoading(true);
    listarPedidosDoUsuario(usuarioId)
      .then((data) => {
        if (mounted) {
          setPedidos(data.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()));
          setPedidosLoaded(true);
        }
      })
      .catch((err) => {
        if (mounted) setPedidosError(getErrorMessage(err, "Nao foi possivel carregar os pedidos."));
      })
      .finally(() => {
        if (mounted) setPedidosLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, pedidosLoaded, usuarioId]);

  // Lazy load reservas
  useEffect(() => {
    if (activeTab !== "reservas" || reservasLoaded || !usuarioId) return;
    let mounted = true;
    setReservasLoading(true);
    listarReservasDoUsuario(usuarioId)
      .then((data) => {
        if (mounted) {
          setReservas(data.sort((a, b) => new Date(b.dataHoraReserva).getTime() - new Date(a.dataHoraReserva).getTime()));
          setReservasLoaded(true);
        }
      })
      .catch((err) => {
        if (mounted) setReservasError(getErrorMessage(err, "Nao foi possivel carregar as reservas."));
      })
      .finally(() => {
        if (mounted) setReservasLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, reservasLoaded, usuarioId]);

  // Lazy load enderecos
  useEffect(() => {
    if (activeTab !== "enderecos" || enderecosLoaded || !usuarioId) return;
    let mounted = true;
    setEnderecosLoading(true);
    listarEnderecosDoUsuario(usuarioId)
      .then((data) => {
        if (mounted) {
          setEnderecos(data);
          setEnderecosLoaded(true);
        }
      })
      .catch((err) => {
        if (mounted) setEnderecosError(getErrorMessage(err, "Nao foi possivel carregar os enderecos."));
      })
      .finally(() => {
        if (mounted) setEnderecosLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, enderecosLoaded, usuarioId]);

  // --- Handlers: Dados Pessoais ---
  const handleSaveDados = async (e: FormEvent) => {
    e.preventDefault();
    setDadosMsg({ error: "", success: "" });
    if (!nome.trim() || !email.trim()) {
      setDadosMsg({ error: "Preencha nome e email.", success: "" });
      return;
    }
    if (!senhaAtual.trim()) {
      setDadosMsg({ error: "Informe sua senha atual para confirmar a alteracao.", success: "" });
      return;
    }
    setIsSavingDados(true);
    try {
      await atualizarUsuario(usuarioId!, { nome: nome.trim(), email: email.trim(), senha: senhaAtual });
      updateUsuario({ nomeUsuario: nome.trim(), email: email.trim() });
      setSenhaAtual("");
      setDadosMsg({ error: "", success: "Dados atualizados com sucesso." });
    } catch (err) {
      setDadosMsg({ error: getErrorMessage(err, "Nao foi possivel atualizar seus dados."), success: "" });
    } finally {
      setIsSavingDados(false);
    }
  };

  const handleSaveSenha = async (e: FormEvent) => {
    e.preventDefault();
    setSenhaMsg({ error: "", success: "" });
    if (!senhaAntiga.trim()) {
      setSenhaMsg({ error: "Informe sua senha atual para confirmar a alteracao.", success: "" });
      return;
    }
    if (!novaSenha.trim() || novaSenha.length < 6) {
      setSenhaMsg({ error: "A nova senha deve ter pelo menos 6 caracteres.", success: "" });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg({ error: "As senhas nao coincidem.", success: "" });
      return;
    }
    setIsSavingSenha(true);
    try {
      await atualizarUsuario(usuarioId!, { nome: usuario?.nomeUsuario ?? "", email: usuario?.email ?? "", senha: novaSenha, senhaAtual: senhaAntiga });
      setSenhaAntiga("");
      setNovaSenha("");
      setConfirmarSenha("");
      setSenhaMsg({ error: "", success: "Senha alterada com sucesso." });
    } catch (err) {
      setSenhaMsg({ error: getErrorMessage(err, "Nao foi possivel alterar a senha."), success: "" });
    } finally {
      setIsSavingSenha(false);
    }
  };

  // --- Handlers: Pedidos ---
  const handleCancelPedido = async (pedidoId: number) => {
    if (!usuarioId) return;
    setPedidosError("");
    try {
      await cancelarPedido(usuarioId, pedidoId);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (err) {
      setPedidosError(getErrorMessage(err, "Nao foi possivel cancelar o pedido."));
    }
  };

  // --- Handlers: Reservas ---
  const handleCancelReserva = async (reservaId: number) => {
    if (!usuarioId) return;
    setReservasError("");
    setReservasSuccess("");
    try {
      await cancelarReserva(usuarioId, reservaId);
      setReservas((prev) =>
        prev.map((r) => (r.id === reservaId ? { ...r, statusReserva: StatusReserva.Cancelada } : r))
      );
      setReservasSuccess("Reserva cancelada com sucesso.");
    } catch (err) {
      setReservasError(getErrorMessage(err, "Nao foi possivel cancelar a reserva."));
    }
  };

  // --- Handlers: Enderecos ---
  const handleAddressInput = <T extends keyof EnderecoRequestDTO>(field: T, value: EnderecoRequestDTO[T]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditEndereco = (endereco: Endereco) => {
    setEditingId(endereco.id);
    setFormData({
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento || "",
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      cep: endereco.cep,
    });
  };

  const handleCancelEditEndereco = () => {
    setEditingId(null);
    setFormData(emptyAddress);
  };

  const handleSubmitEndereco = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioId) return;
    setEnderecosError("");
    setEnderecosSuccess("");
    setIsSavingEndereco(true);
    try {
      if (editingId) {
        await atualizarEndereco(usuarioId, editingId, formData);
        setEnderecos((prev) => prev.map((end) => (end.id === editingId ? { ...end, ...formData } : end)));
        setEnderecosSuccess("Endereco atualizado com sucesso.");
      } else {
        const novo = await criarEndereco(usuarioId, formData);
        setEnderecos((prev) => [...prev, novo]);
        setEnderecosSuccess("Endereco criado com sucesso.");
      }
      setEditingId(null);
      setFormData(emptyAddress);
    } catch (err) {
      setEnderecosError(getErrorMessage(err, editingId ? "Nao foi possivel atualizar o endereco." : "Nao foi possivel criar o endereco."));
    } finally {
      setIsSavingEndereco(false);
    }
  };

  const handleDeleteEndereco = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este endereco?")) return;
    if (!usuarioId) return;
    setEnderecosError("");
    setEnderecosSuccess("");
    try {
      await deletarEndereco(usuarioId, id);
      setEnderecos((prev) => prev.filter((e) => e.id !== id));
      setEnderecosSuccess("Endereco excluido com sucesso.");
      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyAddress);
      }
    } catch (err) {
      setEnderecosError(getErrorMessage(err, "Nao foi possivel excluir o endereco."));
    }
  };

  // --- Render helpers ---
  const renderDados = () => (
    <>
      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Informacoes pessoais</span>
            <h2>Editar dados</h2>
          </div>
        </div>
        <form className="form-grid form-grid--two" onSubmit={handleSaveDados}>
          <label className="field">
            <span>Nome</span>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field field--full">
            <span>Senha atual (para confirmar)</span>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Digite sua senha atual" />
          </label>
          <div className="field--full">
            <button className="button button--primary" disabled={isSavingDados} type="submit">
              {isSavingDados ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </form>
        {dadosMsg.error ? <div className="message message--error">{dadosMsg.error}</div> : null}
        {dadosMsg.success ? <div className="message message--success">{dadosMsg.success}</div> : null}
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Seguranca</span>
            <h2>Alterar senha</h2>
          </div>
        </div>
        <form className="form-grid form-grid--two" onSubmit={handleSaveSenha}>
          <label className="field field--full">
            <span>Senha atual</span>
            <input type="password" value={senhaAntiga} onChange={(e) => setSenhaAntiga(e.target.value)} placeholder="Digite sua senha atual" />
          </label>
          <label className="field">
            <span>Nova senha</span>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Minimo 6 caracteres" />
          </label>
          <label className="field">
            <span>Confirmar nova senha</span>
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" />
          </label>
          <div className="field--full">
            <button className="button button--secondary" disabled={isSavingSenha} type="submit">
              {isSavingSenha ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
        {senhaMsg.error ? <div className="message message--error">{senhaMsg.error}</div> : null}
        {senhaMsg.success ? <div className="message message--success">{senhaMsg.success}</div> : null}
      </section>
    </>
  );

  const renderPedidos = () => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">Historico</span>
          <h2>Meus pedidos</h2>
        </div>
      </div>

      {pedidosLoading ? (
        <div className="loading-state">
          <span className="route-status__spinner" />
          <p>Carregando pedidos...</p>
        </div>
      ) : pedidosError ? (
        <div className="message message--error">{pedidosError}</div>
      ) : pedidos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum pedido encontrado.</p>
          <button className="button button--primary" onClick={() => navigate("/cardapio")} type="button">
            Fazer meu primeiro pedido
          </button>
        </div>
      ) : (
        <div className="history-list">
          {pedidos.map((pedido) => (
            <article className="history-card" key={pedido.id}>
              <div className="history-card__header">
                <div>
                  <strong>Pedido #{pedido.id}</strong>
                  <span>{formatDateTime(pedido.dataHora)}</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  {pedido.status && (
                    <span className={`pill pill--${corStatusPedido[pedido.status] ?? "outline"}`}>
                      {labelStatusPedido[pedido.status] ?? pedido.status}
                    </span>
                  )}
                  <span className="pill pill--outline">
                    {getTipoAtendimentoLabel(pedido.tipoAtendimento)}
                  </span>
                </div>
              </div>

              <div className="tag-list">
                {(pedido.itens ?? []).map((item, index) => (
                  <span className="tag" key={`${pedido.id}-${index}`}>
                    {typeof item === "string" ? item : `${item.quantidade}x ${item.nomeItem}`}
                  </span>
                ))}
              </div>

              <div className="summary-list summary-list--compact">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(pedido.subtotal)}</strong>
                </div>
                <div>
                  <span>Desconto</span>
                  <strong>{formatCurrency(pedido.desconto)}</strong>
                </div>
                <div>
                  <span>Taxa</span>
                  <strong>{formatCurrency(pedido.taxaEntrega)}</strong>
                </div>
                <div className="summary-list__total">
                  <span>Total</span>
                  <strong>{formatCurrency(pedido.total)}</strong>
                </div>
              </div>

              <div className="button-group">
                {pedido.status && pedido.tipoAtendimento?.toLowerCase().includes("propri") &&
                  pedido.status !== StatusPedido.Entregue && pedido.status !== StatusPedido.Cancelado && (
                  <button className="button button--secondary" onClick={() => navigate(`/pedidos/${pedido.id}/acompanhamento`)} type="button">
                    Acompanhar
                  </button>
                )}
                {pedido.status !== StatusPedido.Entregue && pedido.status !== StatusPedido.Cancelado && (
                  <button className="button button--ghost" onClick={() => handleCancelPedido(pedido.id)} type="button">
                    Cancelar pedido
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderReservas = () => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">Historico</span>
          <h2>Minhas reservas</h2>
        </div>
      </div>

      {reservasError ? <div className="message message--error">{reservasError}</div> : null}
      {reservasSuccess ? <div className="message message--success">{reservasSuccess}</div> : null}

      {reservasLoading ? (
        <div className="loading-state">
          <span className="route-status__spinner" />
          <p>Carregando reservas...</p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma reserva encontrada.</p>
          <button className="button button--primary" onClick={() => navigate("/reservas")} type="button">
            Fazer minha primeira reserva
          </button>
        </div>
      ) : (
        <div className="history-list">
          {reservas.map((reserva) => {
            const isCancelable =
              reserva.statusReserva === StatusReserva.Ativa ||
              reserva.statusReserva === StatusReserva.Confirmada;

            return (
              <article className="history-card" key={reserva.id}>
                <div className="history-card__header">
                  <div>
                    <strong>Reserva #{reserva.id}</strong>
                    <span>{formatDateTime(reserva.dataHoraReserva)}</span>
                  </div>
                  <span className="pill pill--outline">
                    {getStatusReservaLabel(reserva.statusReserva)}
                  </span>
                </div>

                <div className="summary-list summary-list--compact">
                  <div>
                    <span>Pessoas</span>
                    <strong>{reserva.quantidadePessoas}</strong>
                  </div>
                  <div>
                    <span>Mesa</span>
                    <strong>{reserva.numeroMesa}</strong>
                  </div>
                  <div>
                    <span>Codigo</span>
                    <strong>{reserva.codigoConfirmacao ?? "Nao informado"}</strong>
                  </div>
                </div>

                {isCancelable ? (
                  <button className="button button--ghost" onClick={() => handleCancelReserva(reserva.id)} type="button">
                    Cancelar reserva
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderEnderecos = () => (
    <>
      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">{editingId ? "Editar" : "Novo"} endereco</span>
            <h2>{editingId ? "Editar Endereco" : "Adicionar Endereco"}</h2>
          </div>
        </div>

        <form className="form-grid form-grid--two" onSubmit={handleSubmitEndereco}>
          <label className="field field--full">
            <span>Rua</span>
            <input type="text" value={formData.rua} onChange={(e) => handleAddressInput("rua", e.target.value)} required />
          </label>
          <label className="field">
            <span>Numero</span>
            <input type="text" value={formData.numero} onChange={(e) => handleAddressInput("numero", e.target.value)} required />
          </label>
          <label className="field">
            <span>Complemento</span>
            <input type="text" value={formData.complemento} onChange={(e) => handleAddressInput("complemento", e.target.value)} />
          </label>
          <label className="field">
            <span>Bairro</span>
            <input type="text" value={formData.bairro} onChange={(e) => handleAddressInput("bairro", e.target.value)} required />
          </label>
          <label className="field">
            <span>Cidade</span>
            <input type="text" value={formData.cidade} onChange={(e) => handleAddressInput("cidade", e.target.value)} required />
          </label>
          <label className="field">
            <span>Estado</span>
            <input type="text" value={formData.estado} maxLength={2} onChange={(e) => handleAddressInput("estado", e.target.value.toUpperCase())} required />
          </label>
          <label className="field field--full">
            <span>CEP</span>
            <input type="text" value={formData.cep} maxLength={8} onChange={(e) => handleAddressInput("cep", e.target.value)} required />
          </label>
          <div className="field--full">
            <div className="button-group">
              <button className="button button--primary" disabled={isSavingEndereco} type="submit">
                {isSavingEndereco ? "Salvando..." : editingId ? "Atualizar Endereco" : "Adicionar Endereco"}
              </button>
              {editingId ? (
                <button className="button button--ghost" onClick={handleCancelEditEndereco} type="button">
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        </form>

        {enderecosError ? <div className="message message--error">{enderecosError}</div> : null}
        {enderecosSuccess ? <div className="message message--success">{enderecosSuccess}</div> : null}
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Lista</span>
            <h2>Enderecos Cadastrados</h2>
          </div>
        </div>

        {enderecosLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando enderecos...</p>
          </div>
        ) : enderecos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum endereco cadastrado. Adicione seu primeiro endereco acima.</p>
          </div>
        ) : (
          <div className="history-list">
            {enderecos.map((endereco) => (
              <article className="history-card" key={endereco.id}>
                <div className="history-card__header">
                  <div>
                    <strong>{formatAddress(endereco)}</strong>
                  </div>
                </div>
                <div className="summary-list summary-list--compact">
                  <div>
                    <span>Bairro</span>
                    <strong>{endereco.bairro}</strong>
                  </div>
                  <div>
                    <span>Cidade/Estado</span>
                    <strong>{endereco.cidade}/{endereco.estado}</strong>
                  </div>
                  <div>
                    <span>CEP</span>
                    <strong>{endereco.cep}</strong>
                  </div>
                </div>
                <div className="button-group">
                  <button className="button button--ghost" onClick={() => handleEditEndereco(endereco)} type="button">
                    Editar
                  </button>
                  <button className="button button--ghost button--danger" onClick={() => handleDeleteEndereco(endereco.id)} type="button">
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Meu Perfil</span>
          <h1>{usuario?.nomeUsuario ?? "Cliente"}</h1>
          <p className="hero__lead">
            Gerencie seus dados, acompanhe pedidos e reservas, e administre seus enderecos.
          </p>
        </div>
      </section>

      <div className="segmented">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`segmented__button${activeTab === tab.value ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dados" && renderDados()}
      {activeTab === "pedidos" && renderPedidos()}
      {activeTab === "reservas" && renderReservas()}
      {activeTab === "enderecos" && renderEnderecos()}
    </AppShell>
  );
};

export default PerfilPage;
