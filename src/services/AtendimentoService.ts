import api from "./api";
import type { Atendimento } from "../types/Atendimento";
import { TipoAgendamento } from "../types/enums/TipoAgendamento";

// DTO para criar/atualizar atendimento
export interface AtendimentoRequestDTO {
  tipoAtendimento: number;
  observacaoEntrega?: string;
  nomeAplicativo?: string;
}

// =========================
// LISTAR
// =========================
export const listarAtendimentos = async (): Promise<Atendimento[]> => {
  const { data } = await api.get<Atendimento[]>("/atendimento");
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarAtendimentoPorId = async (id: number): Promise<Atendimento> => {
  const { data } = await api.get<Atendimento>(`/atendimento/${id}`);
  return data;
};

// =========================
// CRIAR (generico)
// =========================
export const criarAtendimento = async (
  dto: AtendimentoRequestDTO
): Promise<Atendimento> => {
  const { data } = await api.post<Atendimento>("/atendimento", dto);
  return data;
};

// =========================
// CRIAR PRESENCIAL
// =========================
export const criarAtendimentoPresencial = async (
  observacao?: string
): Promise<Atendimento> => {
  return criarAtendimento({
    tipoAtendimento: TipoAgendamento.AtendimentoPresencial,
    observacaoEntrega: observacao,
  });
};

// =========================
// CRIAR DELIVERY PROPRIO
// =========================
export const criarAtendimentoDeliveryProprio = async (
  observacaoEntrega?: string
): Promise<Atendimento> => {
  return criarAtendimento({
    tipoAtendimento: TipoAgendamento.DeliveryProprio,
    observacaoEntrega,
  });
};

// =========================
// CRIAR DELIVERY APLICATIVO
// =========================
export const criarAtendimentoDeliveryAplicativo = async (
  nomeAplicativo: string,
  observacaoEntrega?: string
): Promise<Atendimento> => {
  return criarAtendimento({
    tipoAtendimento: TipoAgendamento.DeliveryAplicativo,
    nomeAplicativo,
    observacaoEntrega,
  });
};

// =========================
// DELETAR
// =========================
export const deletarAtendimento = async (id: number): Promise<void> => {
  await api.delete(`/atendimento/${id}`);
};
