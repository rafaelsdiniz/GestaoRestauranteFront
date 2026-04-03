import type { BaseEntity } from "./BaseEntity";

export interface ItemPedido extends BaseEntity {
  nomeItem: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}