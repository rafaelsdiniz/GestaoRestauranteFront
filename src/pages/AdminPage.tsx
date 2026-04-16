import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
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
import { getConfiguracoes, atualizarConfiguracoes, type ConfiguracaoRestauranteDTO } from "../services/ConfiguracaoService";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import { Periodo } from "../types/enums/Periodo";
import { getErrorMessage } from "../utils/error";
import { formatDate, formatDateTime, getPeriodoLabel, toDateInputValue, formatarPreco } from "../utils/formatters";

const transicoesPedido: Record<string, string[]> = {
  Recebido: ["EmPreparo", "Cancelado"],
  EmPreparo: ["Pronto", "Cancelado"],
  Pronto: ["Entregue", "Cancelado"],
  Entregue: [],
  Cancelado: [],
};

const transicoesReserva: Record<string, string[]> = {
  Ativa: ["Confirmada", "Cancelada"],
  Confirmada: ["Finalizada", "Cancelada"],
  Cancelada: [],
  Finalizada: [],
};

const labelStatusPedido: Record<string, string> = {
  EmPreparo: "Em Preparo",
  Pronto: "Pronto",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
};

type AdminSection = "dashboard" | "pedidos" | "reservas" | "clientes" | "relatorios" | "sugestoes" | "configuracoes";

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
  const [configuracao, setConfiguracao] = useState<ConfiguracaoRestauranteDTO | null>(null);
  const [configForm, setConfigForm] = useState<ConfiguracaoRestauranteDTO>({
    almocoInicio: "11:00", almocoFim: "14:00",
    jantarInicio: "18:00", jantarFim: "22:00",
    reservaInicio: "11:00", reservaFim: "14:00",
    antecedenciaMinimaDias: 1,
  });
  const [configLoaded, setConfigLoaded] = useState(false);
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

  // Lazy load configuracoes
  useEffect(() => {
    if (section !== "configuracoes" || configLoaded) return;
    let mounted = true;
    const load = async () => {
      try {
        const data = await getConfiguracoes();
        if (!mounted) return;
        setConfiguracao(data);
        setConfigForm(data);
        setConfigLoaded(true);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, "Erro ao carregar configuracoes."));
      }
    };
    void load();
    return () => { mounted = false; };
  }, [section, configLoaded]);

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setIsSaving(true);
    try {
      const updated = await atualizarConfiguracoes(configForm);
      setConfiguracao(updated);
      setConfigForm(updated);
      setSuccess("Configuracoes salvas com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar configuracoes."));
    } finally {
      setIsSaving(false);
    }
  };

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
    configuracoes: "Configuracoes",
  };

  const CHART_COLORS = ["#B08C3E", "#C9A652", "#8A6C2A", "#8b2635", "#3D8C5C", "#5BA3D9", "#D4A853"];

  const chartTooltipStyle = {
    contentStyle: {
      background: "#FFFFFF",
      border: "1px solid rgba(160,140,100,0.18)",
      borderRadius: "8px",
      fontSize: "0.82rem",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    },
    labelStyle: { fontWeight: 600, color: "#2A2520" },
  };

  const renderDashboard = () => {
    if (!dashboardStats) return null;

    const kpis = [
      { label: "Faturamento Total", value: formatarPreco(dashboardStats.faturamentoTotal), sub: `${formatarPreco(dashboardStats.faturamentoMes)} no mes`, highlight: true },
      { label: "Pedidos", value: dashboardStats.totalPedidos, sub: `${dashboardStats.pedidosHoje} hoje` },
      { label: "Reservas", value: dashboardStats.totalReservas, sub: `${dashboardStats.reservasHoje} hoje` },
      { label: "Usuarios", value: dashboardStats.totalUsuarios, sub: `${dashboardStats.totalAdministradores} admins` },
    ];

    const atendimentoData = [
      { name: "Presencial", valor: dashboardStats.atendimentosPresencial },
      { name: "Delivery", valor: dashboardStats.atendimentosDelivery },
      { name: "App", valor: dashboardStats.atendimentosApp },
    ];

    const cardapioData = [
      { name: "Almoco", valor: dashboardStats.itensAlmoco },
      { name: "Jantar", valor: dashboardStats.itensJantar },
    ];

    const faturamentoChartData = faturamento.map(f => ({
      name: f.tipoAtendimento,
      faturamento: f.totalFaturado,
      pedidos: f.quantidadePedidos,
    }));

    const topItensData = itensVendidos.slice(0, 6).map(item => ({
      name: item.nomeItem.length > 18 ? `${item.nomeItem.slice(0, 18)}...` : item.nomeItem,
      vendidos: item.quantidadeVendida,
      faturamento: item.totalGerado,
    }));

    const statusPedidos: Record<string, number> = {};
    todosPedidos.forEach(p => {
      const s = p.status || "Pendente";
      statusPedidos[s] = (statusPedidos[s] || 0) + 1;
    });
    const statusPedidoData = Object.entries(statusPedidos).map(([name, value]) => ({ name, value }));

    return (
      <>
        {/* KPI Cards */}
        <div className="admin-stats">
          {kpis.map(kpi => (
            <div className={`admin-stat${kpi.highlight ? " admin-stat--highlight" : ""}`} key={kpi.label}>
              <span className="admin-stat__value">{kpi.value}</span>
              <span className="admin-stat__label">{kpi.label}</span>
              <span className="admin-stat__sub">{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* Charts row: Faturamento por tipo + Atendimentos pizza */}
        <div className="admin-grid">
          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Financeiro</span>
                <h3 className="card__title">Faturamento por tipo de atendimento</h3>
              </div>
            </div>
            {faturamentoChartData.length === 0 ? (
              <div className="empty">Sem dados de faturamento.</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={faturamentoChartData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#857B70" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#857B70" }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 100).toFixed(0)}`} />
                    <Tooltip {...chartTooltipStyle} formatter={(v: number) => formatarPreco(v)} />
                    <Bar dataKey="faturamento" name="Faturamento" radius={[6, 6, 0, 0]}>
                      {faturamentoChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Atendimentos</span>
                <h3 className="card__title">Distribuicao por canal</h3>
              </div>
              <span className="admin-stat__sub" style={{ textAlign: "right" }}>
                {dashboardStats.totalAtendimentos} total
              </span>
            </div>
            {dashboardStats.totalAtendimentos === 0 ? (
              <div className="empty">Sem atendimentos registrados.</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={atendimentoData} dataKey="valor" nameKey="name" cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100} paddingAngle={4} stroke="none"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {atendimentoData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "0.82rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Charts row: Top itens vendidos + Status dos pedidos */}
        <div className="admin-grid">
          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Ranking</span>
                <h3 className="card__title">Itens mais vendidos</h3>
              </div>
              <NavLink className="btn btn--ghost btn--sm" to="/admin/relatorios">Ver relatorio</NavLink>
            </div>
            {topItensData.length === 0 ? (
              <div className="empty">Sem dados de vendas.</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topItensData} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#857B70" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "#857B70" }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="vendidos" name="Vendidos" fill="#B08C3E" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Status</span>
                <h3 className="card__title">Pedidos por status</h3>
              </div>
              <NavLink className="btn btn--ghost btn--sm" to="/admin/pedidos">Ver pedidos</NavLink>
            </div>
            {statusPedidoData.length === 0 ? (
              <div className="empty">Nenhum pedido registrado.</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusPedidoData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={100} paddingAngle={3} stroke="none"
                      label={({ name, value }) => `${labelStatusPedido[name] || name}: ${value}`}
                    >
                      {statusPedidoData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "0.82rem" }}
                      formatter={(value: string) => labelStatusPedido[value] || value} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Cardapio split + Pedidos recentes + Reservas */}
        <div className="admin-grid">
          <div className="card">
            <div className="card__header">
              <div>
                <span className="card__label">Cardapio</span>
                <h3 className="card__title">Itens por periodo</h3>
              </div>
              <span className="admin-stat__sub">{dashboardStats.totalItensCardapio} itens</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cardapioData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#857B70" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#857B70" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="valor" name="Itens" radius={[6, 6, 0, 0]}>
                    <Cell fill="#B08C3E" />
                    <Cell fill="#8b2635" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
        </div>

        {/* Pedidos recentes + Reservas proximas */}
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
                    {(transicoesPedido[pedido.status] ?? []).length > 0 ? (
                      <select
                        className="admin-table__select"
                        value=""
                        onChange={e => {
                          if (e.target.value) void handleChangeOrderStatus(pedido.id, e.target.value);
                        }}
                      >
                        <option value="">Alterar...</option>
                        {(transicoesPedido[pedido.status] ?? []).map(s => (
                          <option key={s} value={s}>{labelStatusPedido[s] || s}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: "0.78rem", opacity: 0.5 }}>Final</span>
                    )}
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
                    {(transicoesReserva[reserva.statusReserva] ?? []).length > 0 ? (
                      <select
                        className="admin-table__select"
                        value=""
                        onChange={e => {
                          if (e.target.value) void handleChangeReservationStatus(reserva.id, e.target.value);
                        }}
                      >
                        <option value="">Alterar...</option>
                        {(transicoesReserva[reserva.statusReserva] ?? []).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: "0.78rem", opacity: 0.5 }}>Final</span>
                    )}
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

  const renderConfiguracoes = () => (
    <div className="admin-grid">
      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Horarios</span>
            <h3 className="card__title">Horario de funcionamento</h3>
          </div>
        </div>
        <form className="form-grid form-grid--two" style={{ gap: "0.75rem" }} onSubmit={handleSaveConfig}>
          <label className="field">
            <span className="field__label">Almoco - Inicio</span>
            <input className="field__input" type="time" value={configForm.almocoInicio}
              onChange={e => setConfigForm(prev => ({ ...prev, almocoInicio: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Almoco - Fim</span>
            <input className="field__input" type="time" value={configForm.almocoFim}
              onChange={e => setConfigForm(prev => ({ ...prev, almocoFim: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Jantar - Inicio</span>
            <input className="field__input" type="time" value={configForm.jantarInicio}
              onChange={e => setConfigForm(prev => ({ ...prev, jantarInicio: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Jantar - Fim</span>
            <input className="field__input" type="time" value={configForm.jantarFim}
              onChange={e => setConfigForm(prev => ({ ...prev, jantarFim: e.target.value }))} />
          </label>

          <div className="field--full" style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <span className="card__label" style={{ marginBottom: "0.75rem", display: "block" }}>Reservas</span>
          </div>
          <label className="field">
            <span className="field__label">Reserva - Inicio</span>
            <input className="field__input" type="time" value={configForm.reservaInicio}
              onChange={e => setConfigForm(prev => ({ ...prev, reservaInicio: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Reserva - Fim</span>
            <input className="field__input" type="time" value={configForm.reservaFim}
              onChange={e => setConfigForm(prev => ({ ...prev, reservaFim: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Antecedencia minima (dias)</span>
            <input className="field__input" type="number" min={0} max={30} value={configForm.antecedenciaMinimaDias}
              onChange={e => setConfigForm(prev => ({ ...prev, antecedenciaMinimaDias: Number(e.target.value) }))} />
          </label>

          <button className="btn btn--primary btn--block field--full" disabled={isSaving} type="submit" style={{ marginTop: "0.5rem" }}>
            {isSaving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <span className="card__label">Resumo atual</span>
            <h3 className="card__title">Configuracao vigente</h3>
          </div>
        </div>
        {configuracao ? (
          <div className="admin-list">
            <div className="admin-list__item">
              <div><strong>Almoco</strong></div>
              <div className="admin-list__right">{configuracao.almocoInicio} - {configuracao.almocoFim}</div>
            </div>
            <div className="admin-list__item">
              <div><strong>Jantar</strong></div>
              <div className="admin-list__right">{configuracao.jantarInicio} - {configuracao.jantarFim}</div>
            </div>
            <div className="admin-list__item">
              <div><strong>Reservas</strong></div>
              <div className="admin-list__right">{configuracao.reservaInicio} - {configuracao.reservaFim}</div>
            </div>
            <div className="admin-list__item">
              <div><strong>Antecedencia minima</strong></div>
              <div className="admin-list__right">{configuracao.antecedenciaMinimaDias} dia(s)</div>
            </div>
          </div>
        ) : (
          <div className="empty">Carregando configuracoes...</div>
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
      case "configuracoes": return renderConfiguracoes();
    }
  };

  return (
    <div className="admin-page admin-page--shell">
      <div className="section__header animate-in">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 600 }}>
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
