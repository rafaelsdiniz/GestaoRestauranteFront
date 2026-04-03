import api from "./api";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import type { SugestaoChefeRequestDTO } from "../types/dto/sugestao-chefe/SugestaoChefeRequestDTO";


export const listarSugestoes = async () => {
  const { data } = await api.get<SugestaoChefe[]>("/sugestoes-chefe");
  return data;
};

export const buscarSugestaoPorId = async (id: number) => {
  const { data } = await api.get<SugestaoChefe>(`/sugestoes-chefe/${id}`);
  return data;
};

export const criarSugestao = async (dto: SugestaoChefeRequestDTO) => {
  const { data } = await api.post<SugestaoChefe>("/sugestoes-chefe", dto);
  return data;
};

export const deletarSugestao = async (id: number) => {
  await api.delete(`/sugestoes-chefe/${id}`);
};