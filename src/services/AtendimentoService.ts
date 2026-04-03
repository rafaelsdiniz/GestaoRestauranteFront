import api from "./api";
import type { Atendimento } from "../types/Atendimento";
import type { AtendimentoRequestDTO } from "../types/dto/atendimento/AtendimentoRequestDTO";

export const criarAtendimento = async (dto: AtendimentoRequestDTO) => {
  const { data } = await api.post<Atendimento>("/atendimentos", dto);
  return data;
};

export const listarAtendimentos = async () => {
  const { data } = await api.get<Atendimento[]>("/atendimentos");
  return data;
};

export const buscarAtendimentoPorId = async (id: number) => {
  const { data } = await api.get<Atendimento>(`/atendimentos/${id}`);
  return data;
};

export const deletarAtendimento = async (id: number) => {
  const { data } = await api.delete<boolean>(`/atendimentos/${id}`);
  return data;
};