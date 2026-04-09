import api from "./api";
import type { Pedido } from "../types/Pedido";
import type { PedidoRequestDTO } from "../types/dto/pedido/PedidoRequestDTO";

// =========================
// LISTAR PEDIDOS DO USUARIO
// =========================
export const listarPedidosDoUsuario = async (
  usuarioId: number
): Promise<Pedido[]> => {
  const { data } = await api.get<Pedido[]>(`/usuarios/${usuarioId}/pedidos`);
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarPedidoPorId = async (
  usuarioId: number,
  id: number
): Promise<Pedido> => {
  const { data } = await api.get<Pedido>(
    `/usuarios/${usuarioId}/pedidos/${id}`
  );
  return data;
};

// =========================
// CRIAR PEDIDO
// =========================
export const criarPedido = async (
  usuarioId: number,
  dto: PedidoRequestDTO
): Promise<Pedido> => {
  const { data } = await api.post<Pedido>(
    `/usuarios/${usuarioId}/pedidos`,
    dto
  );
  return data;
};

// =========================
// CANCELAR PEDIDO
// =========================
export const cancelarPedido = async (
  usuarioId: number,
  id: number
): Promise<void> => {
  await api.delete(`/usuarios/${usuarioId}/pedidos/${id}`);
};
