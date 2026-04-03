import type { BaseEntity } from "./BaseEntity";
import type { Periodo } from "./enums/Periodo";

export interface ItemCardapio extends BaseEntity {
  nome: string;
  descricao: string;
  precoBase: number;
  periodo: Periodo;
  ehSugestaoDoChefe: boolean;
  ingredientes: string[];
}