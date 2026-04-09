/**
 * Enums para exibição conforme GuiaFront.md
 */

// PERIODO já existe em src/types/enums/Periodo.ts
import { Periodo } from "../types/enums/Periodo";

// Mapeamento para exibição
export const PERIODO_DISPLAY: Record<number, string> = {
  [Periodo.Almoco]: "Almoço",
  [Periodo.Jantar]: "Jantar",
};

// TIPO_ATENDIMENTO conforme guia
export const TIPO_ATENDIMENTO = {
  1: "Presencial",
  2: "Delivery Próprio",
  3: "Delivery Aplicativo",
} as const;

export type TipoAtendimento = keyof typeof TIPO_ATENDIMENTO;

// STATUS_RESERVA já existe em src/types/enums/StatusReserva.ts
import { StatusReserva } from "../types/enums/StatusReserva";

export const STATUS_RESERVA_DISPLAY: Record<number, string> = {
  [StatusReserva.Ativa]: "Ativa",
  [StatusReserva.Cancelada]: "Cancelada",
  [StatusReserva.Finalizada]: "Finalizada",
  [StatusReserva.Confirmada]: "Confirmada",
};

// Funções auxiliares
export const getPeriodoDisplay = (periodo: number): string => {
  return PERIODO_DISPLAY[periodo] || "Desconhecido";
};

export const getTipoAtendimentoDisplay = (tipo: number): string => {
  return TIPO_ATENDIMENTO[tipo as TipoAtendimento] || "Desconhecido";
};

export const getStatusReservaDisplay = (status: number): string => {
  return STATUS_RESERVA_DISPLAY[status] || "Desconhecido";
};