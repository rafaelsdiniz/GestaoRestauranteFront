import api from "./api";

// =========================
// DASHBOARD
// =========================
export interface DashboardStats {
  totalUsuarios: number;
  totalAdministradores: number;
  totalClientes: number;
  totalPedidos: number;
  pedidosHoje: number;
  pedidosMes: number;
  totalReservas: number;
  reservasHoje: number;
  reservasMes: number;
  totalAtendimentos: number;
  atendimentosPresencial: number;
  atendimentosDelivery: number;
  atendimentosApp: number;
  totalItensCardapio: number;
  itensAlmoco: number;
  itensJantar: number;
  faturamentoTotal: number;
  faturamentoMes: number;
  dataAtualizacao: string;
}

// =========================
// USUÁRIOS
// =========================
export interface UsuarioComEstatisticas {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  totalPedidos: number;
  totalReservas: number;
  ultimoPedido: string | null;
  ultimaReserva: string | null;
}

export interface TipoUsuarioUpdateDTO {
  novoTipo: string;
}

// =========================
// PEDIDOS
// =========================
export interface ItemPedidoAdmin {
  itemCardapioNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface PedidoAdmin {
  id: number;
  dataHora: string;
  periodo: string;
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;
  status: string;
  usuarioNome: string;
  usuarioEmail: string;
  tipoAtendimento: string;
  observacao?: string | null;
  observacaoEntrega?: string | null;
  enderecoEntrega?: string | null;
  nomeAplicativo?: string | null;
  endereco?: string | {
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
  } | null;
  atendimento?: {
    observacao?: string | null;
    observacaoEntrega?: string | null;
    enderecoEntrega?: string | null;
    nomeAplicativo?: string | null;
  } | null;
  itens: ItemPedidoAdmin[];
}

export interface FiltrosPedidosAdmin {
  status?: string;
  periodo?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface AlterarStatusPedidoDTO {
  novoStatus: string;
}

// =========================
// RESERVAS
// =========================
export interface ReservaAdmin {
  id: number;
  dataHoraReserva: string;
  quantidadePessoas: number;
  statusReserva: string;
  codigoConfirmacao: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  mesaNumero: number;
  mesaCapacidade: number;
}

export interface FiltrosReservasAdmin {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface AlterarStatusReservaDTO {
  novoStatus: string;
}

// =========================
// MÉTODOS - DASHBOARD
// =========================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>("/admin/dashboard");
  return data;
};

// =========================
// MÉTODOS - USUÁRIOS
// =========================
export const listarUsuariosComEstatisticas = async (): Promise<UsuarioComEstatisticas[]> => {
  const { data } = await api.get<UsuarioComEstatisticas[]>("/admin/usuarios");
  return data;
};

export const alterarTipoUsuario = async (
  usuarioId: number,
  novoTipo: string
): Promise<{ mensagem: string }> => {
  const { data } = await api.put<{ mensagem: string }>(
    `/admin/usuarios/${usuarioId}/tipo`,
    { novoTipo }
  );
  return data;
};

// =========================
// MÉTODOS - PEDIDOS
// =========================
export const getUltimosPedidos = async (): Promise<PedidoAdmin[]> => {
  const { data } = await api.get<PedidoAdmin[]>("/admin/pedidos/recentes");
  return data;
};

export const listarTodosPedidos = async (
  filtros?: FiltrosPedidosAdmin
): Promise<PedidoAdmin[]> => {
  const { data } = await api.get<PedidoAdmin[]>("/admin/pedidos", {
    params: filtros,
  });
  return data;
};

export const alterarStatusPedido = async (
  pedidoId: number,
  novoStatus: string
): Promise<{ mensagem: string }> => {
  const { data } = await api.put<{ mensagem: string }>(
    `/admin/pedidos/${pedidoId}/status`,
    { novoStatus }
  );
  return data;
};

// =========================
// MÉTODOS - RESERVAS
// =========================
export const getProximasReservas = async (): Promise<ReservaAdmin[]> => {
  const { data } = await api.get<ReservaAdmin[]>("/admin/reservas/proximas");
  return data;
};

export const listarTodasReservas = async (
  filtros?: FiltrosReservasAdmin
): Promise<ReservaAdmin[]> => {
  const { data } = await api.get<ReservaAdmin[]>("/admin/reservas", {
    params: filtros,
  });
  return data;
};

export const alterarStatusReserva = async (
  reservaId: number,
  novoStatus: string
): Promise<{ mensagem: string }> => {
  const { data } = await api.put<{ mensagem: string }>(
    `/admin/reservas/${reservaId}/status`,
    { novoStatus }
  );
  return data;
};
