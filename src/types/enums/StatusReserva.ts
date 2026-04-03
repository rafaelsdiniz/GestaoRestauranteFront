export const StatusReserva = {
  Ativa : 1,
  Cancelada : 2,
  Finalizada : 3,
  Confirmada : 4,
} as const;

export type StatusReserva = (typeof StatusReserva)[keyof typeof StatusReserva];