import api from "./api";
import type { Mesa } from "../types/Mesa";
import type { MesaRequestDTO } from "../types/dto/mesa/MesaRequestDTO";

export const listarMesasDisponiveis = async () => {
  const { data } = await api.get<Mesa[]>("/mesa/disponiveis");
  return data;
};

export const listarMesas = async () => {
  const { data } = await api.get<Mesa[]>("/mesa");
  return data;
};

export const buscarMesaPorId = async (id: number) => {
  const { data } = await api.get<Mesa>(`/mesa/${id}`);
  return data;
};

export const criarMesa = async (dto: MesaRequestDTO) => {
  const { data } = await api.post<Mesa>("/mesa", dto);
  return data;
};

export const atualizarMesa = async (id: number, dto: MesaRequestDTO) => {
  const { data } = await api.put<Mesa>(`/mesa/${id}`, dto);
  return data;
};

export const deletarMesa = async (id: number) => {
  await api.delete(`/mesa/${id}`);
};