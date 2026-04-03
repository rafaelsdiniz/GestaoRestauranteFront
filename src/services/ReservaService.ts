import api from "./api";
import type { Reserva } from "../types/Reserva";
import type { ReservaRequestDTO } from "../types/dto/reserva/ReservaRequestDTO";

export const criarReserva = async (usuarioId: number, dto: ReservaRequestDTO) => {
  const { data } = await api.post<Reserva>(`/reservas/${usuarioId}`, dto);
  return data;
};

export const listarReservas = async () => {
  const { data } = await api.get<Reserva[]>("/reservas");
  return data;
};

export const buscarReservaPorId = async (id: number) => {
  const { data } = await api.get<Reserva>(`/reservas/${id}`);
  return data;
};

export const cancelarReserva = async (id: number) => {
  const { data } = await api.put<boolean>(`/reservas/${id}/cancelar`);
  return data;
};