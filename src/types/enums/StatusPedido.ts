export const StatusPedido = {
  Recebido: "Recebido",
  EmPreparo: "EmPreparo",
  Pronto: "Pronto",
  ACaminho: "ACaminho",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
} as const;

export type StatusPedido = (typeof StatusPedido)[keyof typeof StatusPedido];

export const labelStatusPedido: Record<string, string> = {
  Recebido: "Recebido",
  EmPreparo: "Em Preparo",
  Pronto: "Pronto",
  ACaminho: "A Caminho",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
};

export const corStatusPedido: Record<string, string> = {
  Recebido: "outline",
  EmPreparo: "gold",
  Pronto: "success",
  ACaminho: "gold",
  Entregue: "success",
  Cancelado: "danger",
};
