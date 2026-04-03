export const Periodo = {
  Almoco: 1,
  Jantar: 2,
} as const;

export type Periodo = (typeof Periodo)[keyof typeof Periodo];