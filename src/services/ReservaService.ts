import api from "./api";
import type { Reserva } from "../types/Reserva";
import type { ReservaRequestDTO } from "../types/dto/reserva/ReservaRequestDTO";

// =========================
// CRIAR RESERVA
// =========================
export const criarReserva = async (
  usuarioId: number,
  dto: ReservaRequestDTO
): Promise<Reserva> => {
  const { data } = await api.post<Reserva>(
    `/usuarios/${usuarioId}/reservas`,
    dto
  );
  return data;
};

// =========================
// LISTAR RESERVAS DO USUÁRIO
// =========================
export const listarReservasDoUsuario = async (
  usuarioId: number
): Promise<Reserva[]> => {
  const { data } = await api.get<Reserva[]>(
    `/usuarios/${usuarioId}/reservas`
  );
  return data;
};

// =========================
// BUSCAR RESERVA POR ID
// =========================
export const buscarReservaPorId = async (
  usuarioId: number,
  id: number
): Promise<Reserva> => {
  const { data } = await api.get<Reserva>(
    `/usuarios/${usuarioId}/reservas/${id}`
  );
  return data;
};

// =========================
// CANCELAR RESERVA
// =========================
export const cancelarReserva = async (
  usuarioId: number,
  id: number
): Promise<void> => {
  await api.put(`/usuarios/${usuarioId}/reservas/${id}/cancelar`);
};