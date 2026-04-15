import type { BaseEntity } from "./BaseEntity";
import type { Periodo } from "./enums/Periodo";

export interface Pedido extends BaseEntity {
  dataHora: string;
  periodo: Periodo;

  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;

  nomeUsuario: string;
  tipoAtendimento: string;
  status?: string;

  itens: Array<string | { nomeItem: string; quantidade: number; precoUnitario: number; subtotal: number }>;
}