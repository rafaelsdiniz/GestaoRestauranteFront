import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import {
  getDashboardStats,
  listarUsuariosComEstatisticas,
  getUltimosPedidos,
  getProximasReservas,
  alterarTipoUsuario,
  alterarStatusPedido,
  alterarStatusReserva,
  listarTodosPedidos,
  listarTodasReservas,
  type DashboardStats,
  type UsuarioComEstatisticas,
  type PedidoAdmin,
  type ReservaAdmin,
} from "../services/AdminService";
import { listarItensCardapio } from "../services/ItemCardapioService";
import { faturamentoPorTipo, itensMaisVendidos, type FaturamentoPorTipo, type ItemMaisVendido } from "../services/RelatorioService";
import { criarSugestao, listarSugestoes } from "../services/SugestaoChefe";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import { Periodo } from "../types/enums/Periodo";
import { getErrorMessage } from "../utils/error";
import { formatDate, formatDateTime, getPeriodoLabel, toDateInputValue, formatarPreco } from "../utils/formatters";

type AdminSection = "dashboard" | "pedidos" | "reservas" | "clientes" | "relatorios" | "sugestoes";

interface AdminPageProps {
  section?: AdminSection;
}

const today = new Date();
const lastWeek = new Date();
lastWeek.setDate(today.getDate() - 7);

const AdminPage = ({ section = "dashboard" }: AdminPageProps) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioComEstatisticas[]>([]);
  const [ultimosPedidos, setUltimosPedidos] = useState<PedidoAdmin[]>([]);
  const [todosPedidos, setTodosPedidos] = useState<PedidoAdmin[]>([]);
  const [proximasReservas, setProximasReservas] = useState<ReservaAdmin[]>([]);
  const [todasReservas, setTodasReservas] = useState<ReservaAdmin[]>([]);
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [faturamento, setFaturamento] = useState<FaturamentoPorTipo[]>([]);
  const [itensVendidos, setItensVendidos] = useState<ItemMaisVendido[]>([]);
  const [rangeStart, setRangeStart] = useState(toDateInputValue(lastWeek));
  const [rangeEnd, setRangeEnd] = useState(toDateInputValue(today));
  const [sugestaoPeriodo, setSugestaoPeriodo] = useState<Periodo>(Periodo.Almoco);
  const [sugestaoData, setSugestaoData] = useState(toDateInputValue(today));
  const [itemSugestaoId, setItemSugestaoId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboard = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    setError("");
    const results = await Promise.allSettled([
      getDashboardStats(),
      listarUsuariosComEstatisticas(),
      getUltimosPedidos(),
      getProximasReservas(),
      listarItensCardapio(),
      listarSugestoes(),
      faturamentoPorTipo(rangeStart, rangeEnd),
      itensMaisVendidos(),
      listarTodosPedidos(),
      listarTodasReservas(),
    ]);
    const [statsR, usuariosR, pedidosR, reservasR, iR, sR, fR, ivR, tpR, trR] = results;
    if (statsR.status === "fulfilled") setDashboardStats(statsR.value);
    if (usuariosR.status === "fulfilled") setUsuarios(usuariosR.value);
    if (pedidosR.status === "fulfilled") setUltimosPedidos(pedidosR.value);
    if (reservasR.status === "fulfilled") setProximasReservas(reservasR.value);
    if (iR.status === "fulfilled") setItens(iR.value);
    if (sR.status === "fulfilled") setSugestoes(sR.value);
    if (fR.status === "fulfilled") setFaturamento(fR.value);
    if (ivR.status === "fulfilled") setItensVendidos(ivR.value);
    if (tpR.status === "fulfilled") setTodosPedidos(tpR.value);
    if (trR.status === "fulfilled") setTodasReservas(trR.value);
    const fail = results.find(r => r.status === "rejected");
    if (fail?.status === "rejected") setError(getErrorMessage(fail.reason, "Erro ao carregar dados do painel."));
    refreshing ? setIsRefreshing(false) : setIsLoading(false);
  }, [rangeEnd, rangeStart]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const availableItems = useMemo(
    () => itens.filter(i => i.periodo === sugestaoPeriodo), [itens, sugestaoPeriodo]);

  useEffect(() => {
    if (!availableItems.length) { setItemSugestaoId(0); return; }
    if (!availableItems.some(i => i.id === itemSugestaoId)) setItemSugestaoId(availableItems[0].id);
  }, [availableItems, itemSugestaoId]);

  const handleRefresh = () => void loadDashboard(true);

  const handleChangeUserType = async (userId: number, novoTipo: string) => {
    setError(""); setSuccess("");
    try {
      await alterarTipoUsuario(userId, novoTipo);
      setUsuarios(prev => prev.map(u =>
        u.id === userId ? { ...u, tipoUsuario: novoTipo } : u
      ));
      setSuccess(`Tipo do usuario #${userId} alterado para ${novoTipo}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao alterar tipo do usuario."));
    }
  };

  const handleChangeOrderStatus = async (pedidoId: number, novoStatus: string) => {
    setError(""); setSuccess("");
    try {
      await alterarStatusPedido(pedidoId, novoStatus);
      setTodosPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, status: novoStatus } : p
      ));
      setUltimosPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, status: novoStatus } : p
      ));
      setSuccess(`Status do pedido #${pedidoId} alterado para ${novoStatus}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao alterar status do pedido."));
    }
  };

  const handleChangeReservationStatus = async (reservaId: number, novoStatus: string) => {
    setError(""); setSuccess("");
    try {
      await alterarStatusReserva(reservaId, novoStatus);
      setTodasReservas(prev => prev.map(r =>
        r.id === reservaId ? { ...r, statusReserva: novoStatus } : r
      ));
      setProximasReservas(prev => prev.map(r =>
        r.id === reservaId ? { ...r, statusReserva: novoStatus } : r
      ));
      setSuccess(`Status da reserva #${reservaId} alterado para ${novoStatus}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao alterar status da reserva."));
    }
  };

  const handleCreateSuggestion = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!itemSugestaoId) { setError("Selecione um item."); return; }
    setIsSaving(true);
    try {
      await criarSugestao({ dataSugestao: sugestaoData, periodo: sugestaoPeriodo, itemCardapioId: itemSugestaoId });
      setSugestoes(await listarSugestoes());
      setSuccess("Sugestao do chef cadastrada com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar sugestao."));
    } finally {
      setIsSaving(false);
    }
  };

  const sectionTitle: Record<AdminSection, string> = {
    dashboard: "Dashboard",
    pedidos: "Gestao de Pedidos",
    reservas: "Gestao de Reservas",
    clientes: "Gestao de Clientes",
    relatorios: "Relatorios",
    sugestoes: "Sugestao do Chef",
  };

  const renderDashboard = () => {
    if (!dashboardStats) return null;
    const kpis = [
      { label: "Usuarios", value: dashboardStats.totalUsuarios, sub: `${dashboardStats.totalAdministradores} admins` },
      { label: "Pedidos", value: dashboardStats.totalPedidos, sub: `${dashboardStats.pedidosHoje} hoje` },
      { label: "Reservas", value: dashboardStats.totalReservas, sub: `${dashboardStats.reservasHoje} hoje` },
      { label: "Faturamento", value: formatarPreco(dashboardStats.faturamentoTotal), sub: `${formatarPreco(dashboardStats.faturamentoMes)} no mes` },
      { label: "Atendimentos", value: dashboardStats.totalAtendimentos, sub: `${dashboardStats.atendimentosPresencial} presenciais` },
      { label: "Delivery Proprio", value: dashboardStats.atendimentosDelivery, sub: "entregas proprias" },
      { label: "Delivery App", value: dashboardStats.atendimentosApp, sub: "via aplicativo" },
      { label: "Cardapio", value: dashboardStats.totalItensCardapio, sub: `${dashboardStats.itensAlmoco} almoco / ${dashboardStats.itensJantar} jantar` },
    ];

    return (
      <>
        <div className="admin-stats">
          {kpis.map(kpi => (
            <div className="admin-stat" key={kpi.label}>
              <span className="admin-stat__value">{kpi.value}</span>
              <span className="admin-stat__label">{kpi.label}</span>
              <span className="admin-stat__sub">{kpi.sub}</span>
            </div>
          ))}
        </div>

        <div className="admin-grid">
          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Pedidos recentes</span>
                <h3 className="card__title">Ultimos pedidos registrados</h3>
              </div>
              <NavLink className="btn btn--ghost btn--sm" to="/admin/pedidos">
                Ver todos
              </NavLink>
            </div>
            {ultimosPedidos.length === 0 ? (
              <div className="empty">Nenhum pedido recente.</div>
            ) : (
              <div className="admin-list">
                {ultimosPedidos.slice(0, 5).map(pedido => (
                  <div key={pedido.id} className="admin-list__item">
                    <div>
                      <strong>{pedido.usuarioNome}</strong>
                      <span className="admin-list__meta">{formatDateTime(pedido.dataHora)} - {pedido.tipoAtendimento}</span>
                    </div>
                    <div className="admin-list__right">
                      <span className="admin-list__value">{formatarPreco(pedido.total)}</span>
                      <span className={`pill pill--sm pill--${pedido.status?.toLowerCase() === "concluido" ? "success" : "outline"}`}>
                        {pedido.status || "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Reservas proximas</span>
                <h3 className="card__title">Proximas reservas agendadas</h3>
              </div>
              <NavLink className="btn btn--ghost btn--sm" to="/admin/reservas">
                Ver todas
              </NavLink>
            </div>
            {proximasReservas.length === 0 ? (
              <div className="empty">Nenhuma reserva proxima.</div>
            ) : (
              <div className="admin-list">
                {proximasReservas.slice(0, 5).map(reserva => (
                  <div key={reserva.id} className="admin-list__item">
                    <div>
                      <strong>{reserva.usuarioNome}</strong>
                      <span className="admin-list__meta">{formatDateTime(reserva.dataHoraReserva)} - Mesa {reserva.mesaNumero}</span>
                    </div>
                    <div className="admin-list__right">
                      <span>{reserva.quantidadePessoas} pessoas</span>
                      <span className={`pill pill--sm pill--${reserva.statusReserva?.toLowerCase() === "ativa" ? "success" : "outline"}`}>
                        {reserva.statusReserva}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-grid">
          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Acesso rapido</span>
                <h3 className="card__title">Gestao do restaurante</h3>
              </div>
            </div>
            <div className="admin-quick-links">
              <NavLink className="admin-quick-link" to="/admin/ingredientes">
                <strong>Ingredientes</strong>
                <span>Gerenciar ingredientes do cardapio</span>
              </NavLink>
              <NavLink className="admin-quick-link" to="/admin/mesas">
                <strong>Mesas</strong>
                <span>Gerenciar mesas do restaurante</span>
              </NavLink>
              <NavLink className="admin-quick-link" to="/admin/sugestoes">
                <strong>Sugestoes do Chef</strong>
                <span>Ver todas as sugestoes cadastradas</span>
              </NavLink>
              <NavLink className="admin-quick-link" to="/admin/cardapio">
                <strong>Cardapio</strong>
                <span>Visualizar cardapio publico</span>
              </NavLink>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Resumo financeiro</span>
                <h3 className="card__title">Faturamento por tipo</h3>
              </div>
            </div>
            {faturamento.length === 0 ? (
              <div className="empty">Sem dados de faturamento.</div>
            ) : (
              <div className="admin-list">
                {faturamento.map((item, i) => (
                  <div key={i} className="admin-list__item">
                    <div>
                      <strong>{item.tipoAtendimento}</strong>
                      <span className="admin-list__meta">{item.quantidadePedidos} pedidos</span>
                    </div>
                    <span className="admin-list__value">{formatarPreco(item.totalFaturado)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderPedidos = () => (
    <div className="card">
      <div className="card__header">
        <div>
          <span className="card__label">Gestao de pedidos</span>
          <h3 className="card__title">Todos os pedidos ({todosPedidos.length})</h3>
        </div>
      </div>
      {todosPedidos.length === 0 ? (
        <div className="empty">Nenhum pedido encontrado.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Periodo</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {todosPedidos.map(pedido => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>
                    <strong>{pedido.usuarioNome}</strong>
                    <span className="admin-table__sub">{pedido.usuarioEmail}</span>
                  </td>
                  <td>{formatDateTime(pedido.dataHora)}</td>
                  <td>{pedido.periodo}</td>
                  <td>{pedido.tipoAtendimento}</td>
                  <td className="admin-table__value">{formatarPreco(pedido.total)}</td>
                  <td>
                    <span className={`pill pill--sm pill--${pedido.status?.toLowerCase() === "concluido" ? "success" : pedido.status?.toLowerCase() === "cancelado" ? "danger" : "outline"}`}>
                      {pedido.status || "Pendente"}
                    </span>
                  </td>
                  <td>
                    <select
                      className="admin-table__select"
                      value=""
                      onChange={e => {
                        if (e.target.value) void handleChangeOrderStatus(pedido.id, e.target.value);
                      }}
                    >
                      <option value="">Alterar...</option>
                      <option value="Pendente">Pendente</option>
                      <option value="EmPreparo">Em Preparo</option>
                      <option value="Pronto">Pronto</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Concluido">Concluido</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderReservas = () => (
    <div className="card">
      <div className="card__header">
        <div>
          <span className="card__label">Gestao de reservas</span>
          <h3 className="card__title">Todas as reservas ({todasReservas.length})</h3>
        </div>
      </div>
      {todasReservas.length === 0 ? (
        <div className="empty">Nenhuma reserva encontrada.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data/Hora</th>
                <th>Mesa</th>
                <th>Pessoas</th>
                <th>Codigo</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {todasReservas.map(reserva => (
                <tr key={reserva.id}>
                  <td>#{reserva.id}</td>
                  <td>
                    <strong>{reserva.usuarioNome}</strong>
                    <span className="admin-table__sub">{reserva.usuarioEmail}</span>
                  </td>
                  <td>{formatDateTime(reserva.dataHoraReserva)}</td>
                  <td>Mesa {reserva.mesaNumero} ({reserva.mesaCapacidade} lug.)</td>
                  <td>{reserva.quantidadePessoas}</td>
                  <td>{reserva.codigoConfirmacao || "--"}</td>
                  <td>
                    <span className={`pill pill--sm pill--${reserva.statusReserva?.toLowerCase() === "ativa" || reserva.statusReserva?.toLowerCase() === "confirmada" ? "success" : reserva.statusReserva?.toLowerCase() === "cancelada" ? "danger" : "outline"}`}>
                      {reserva.statusReserva}
                    </span>
                  </td>
                  <td>
                    <select
                      className="admin-table__select"
                      value=""
                      onChange={e => {
                        if (e.target.value) void handleChangeReservationStatus(reserva.id, e.target.value);
                      }}
                    >
                      <option value="">Alterar...</option>
                      <option value="Ativa">Ativa</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Finalizada">Finalizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderClientes = () => (
    <div className="card">
      <div className="card__header">
        <div>
          <span className="card__label">Gestao de clientes</span>
          <h3 className="card__title">Usuarios cadastrados ({usuarios.length})</h3>
        </div>
      </div>
      {usuarios.length === 0 ? (
        <div className="empty">Nenhum usuario encontrado.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Pedidos</th>
                <th>Reservas</th>
                <th>Ult. Pedido</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.nome}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`pill pill--sm pill--${u.tipoUsuario === "Administrador" ? "gold" : "outline"}`}>
                      {u.tipoUsuario}
                    </span>
                  </td>
                  <td>{u.totalPedidos}</td>
                  <td>{u.totalReservas}</td>
                  <td>{formatDate(u.ultimoPedido)}</td>
                  <td>
                    <select
                      className="admin-table__select"
                      value=""
                      onChange={e => {
                        if (e.target.value) void handleChangeUserType(u.id, e.target.value);
                      }}
                    >
                      <option value="">Alterar...</option>
                      <option value="Cliente">Cliente</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderRelatorios = () => (
    <>
      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Faturamento por tipo de atendimento</span>
            <h3 className="card__title">Relatorio financeiro</h3>
          </div>
        </div>
        <div className="form-grid form-grid--two" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
          <label className="field">
            <span className="field__label">Inicio</span>
            <input className="field__input" type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Fim</span>
            <input className="field__input" type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
          </label>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={handleRefresh} type="button" style={{ marginBottom: "1rem" }}>
          {isRefreshing ? "Atualizando..." : "Atualizar relatorio"}
        </button>
        {faturamento.length === 0 ? (
          <div className="empty">Sem dados no periodo selecionado.</div>
        ) : (
          <div className="report-grid">
            {faturamento.map((item, i) => (
              <div className="card card--inner" key={i}>
                <strong>{item.tipoAtendimento}</strong>
                <div className="data-row">
                  <span className="data-row__key">Pedidos</span>
                  <span className="data-row__val">{item.quantidadePedidos.toLocaleString("pt-BR")}</span>
                </div>
                <div className="data-row">
                  <span className="data-row__key">Faturamento</span>
                  <span className="data-row__val">{formatarPreco(item.totalFaturado)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Itens mais vendidos</span>
            <h3 className="card__title">Ranking de vendas</h3>
          </div>
        </div>
        {itensVendidos.length === 0 ? (
          <div className="empty">Sem dados de vendas.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Periodo</th>
                  <th>Vendidos</th>
                  <th>Faturamento</th>
                  <th>Sugestao Chef</th>
                </tr>
              </thead>
              <tbody>
                {itensVendidos.map((item, i) => (
                  <tr key={item.itemId}>
                    <td>{i + 1}</td>
                    <td><strong>{item.nomeItem}</strong></td>
                    <td>{item.periodo}</td>
                    <td>{item.quantidadeVendida.toLocaleString("pt-BR")}</td>
                    <td className="admin-table__value">{formatarPreco(item.totalGerado)}</td>
                    <td>
                      <span className={`pill pill--sm pill--${item.ehSugestaoChefe ? "success" : "outline"}`}>
                        {item.ehSugestaoChefe ? "Sim" : "Nao"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderSugestoes = () => (
    <div className="admin-grid">
      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Cadastrar sugestao</span>
            <h3 className="card__title">Nova sugestao do chef</h3>
          </div>
        </div>
        <form className="form-grid form-grid--two" style={{ gap: "0.75rem" }} onSubmit={handleCreateSuggestion}>
          <label className="field">
            <span className="field__label">Data</span>
            <input className="field__input" type="date" value={sugestaoData} onChange={e => setSugestaoData(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Periodo</span>
            <select className="field__input" value={sugestaoPeriodo}
              onChange={e => setSugestaoPeriodo(Number(e.target.value) as Periodo)}>
              <option value={Periodo.Almoco}>Almoco</option>
              <option value={Periodo.Jantar}>Jantar</option>
            </select>
          </label>
          <label className="field field--full">
            <span className="field__label">Item do cardapio</span>
            <select className="field__input" value={itemSugestaoId}
              onChange={e => setItemSugestaoId(Number(e.target.value))}>
              {availableItems.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </label>
          <button className="btn btn--primary btn--block field--full" disabled={isSaving} type="submit" style={{ marginTop: "0.25rem" }}>
            {isSaving ? "Salvando..." : "Registrar sugestao"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Historico</span>
            <h3 className="card__title">Sugestoes recentes</h3>
          </div>
        </div>
        {sugestoes.length === 0 ? (
          <div className="empty">Nenhuma sugestao cadastrada.</div>
        ) : (
          <div className="admin-list">
            {sugestoes.slice(0, 8).map(s => (
              <div key={s.id} className="admin-list__item">
                <div>
                  <strong>{s.nomeItem}</strong>
                  <span className="admin-list__meta">{formatDate(s.dataSugestao)}</span>
                </div>
                <span className="pill pill--sm pill--outline">{getPeriodoLabel(s.periodo)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (section) {
      case "dashboard": return renderDashboard();
      case "pedidos": return renderPedidos();
      case "reservas": return renderReservas();
      case "clientes": return renderClientes();
      case "relatorios": return renderRelatorios();
      case "sugestoes": return renderSugestoes();
    }
  };

  return (
    <div className="admin-page admin-page--shell">
      <div className="section__header animate-in">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 600 }}>
          {sectionTitle[section]}
        </h1>
      </div>

      {error && <div className="msg msg--error">{error}</div>}
      {success && <div className="msg msg--success">{success}</div>}

      {isLoading ? (
        <div className="loading-box"><span className="spinner" /><span>Carregando painel...</span></div>
      ) : (
        <div className="admin-content animate-in">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
