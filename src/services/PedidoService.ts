import api from "./api";
import type { Pedido } from "../types/Pedido";
import type { PedidoRequestDTO } from "../types/dto/pedido/PedidoRequestDTO";

export const listarPedidos = async () => {
  const { data } = await api.get<Pedido[]>("/pedidos");
  return data;
};

export const criarPedido = async (usuarioId: number, dto: PedidoRequestDTO) => {
  const { data } = await api.post<Pedido>(`/pedidos/${usuarioId}`, dto);
  return data;
};

export const buscarPedidoPorId = async (id: number) => {
  const { data } = await api.get<Pedido>(`/pedidos/${id}`);
  return data;
};
