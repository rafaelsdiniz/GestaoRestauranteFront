export const Categoria = {
  Prato: 1,
  Bebida: 2,
} as const;

export type Categoria = (typeof Categoria)[keyof typeof Categoria];
