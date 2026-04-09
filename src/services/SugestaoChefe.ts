import api from "./api";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import type { SugestaoChefeRequestDTO } from "../types/dto/sugestao-chefe/SugestaoChefeRequestDTO";

// =========================
// LISTAR
// =========================
export const listarSugestoes = async (): Promise<SugestaoChefe[]> => {
  const { data } = await api.get<SugestaoChefe[]>("/sugestaochefe");
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarSugestaoPorId = async (
  id: number
): Promise<SugestaoChefe> => {
  const { data } = await api.get<SugestaoChefe>(`/sugestoes-chef/${id}`);
  return data;
};

// =========================
// CRIAR
// =========================
export const criarSugestao = async (
  dto: SugestaoChefeRequestDTO
): Promise<SugestaoChefe> => {
  const { data } = await api.post<SugestaoChefe>("/sugestaochefe", dto);
  return data;
};

// =========================
// ATUALIZAR
// =========================
export const atualizarSugestao = async (
  id: number,
  dto: SugestaoChefeRequestDTO
): Promise<SugestaoChefe> => {
  const { data } = await api.put<SugestaoChefe>(
    `/sugestoes-chef/${id}`,
    dto
  );
  return data;
};

// =========================
// DELETAR
// =========================
export const deletarSugestao = async (id: number): Promise<void> => {
  await api.delete(`/sugestoes-chef/${id}`);
};