export const TipoAgendamento = {
  AtendimentoPresencial: 1,
  DeliveryProprio: 2,
  DeliveryAplicativo: 3,
} as const;

export type TipoAgendamento = (typeof TipoAgendamento)[keyof typeof TipoAgendamento];