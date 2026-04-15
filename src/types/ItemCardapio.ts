import type { BaseEntity } from "./BaseEntity";
import type { Categoria } from "./enums/Categoria";
import type { Periodo } from "./enums/Periodo";

export interface ItemCardapio extends BaseEntity {
  nome: string;
  descricao: string;
  precoBase: number;
  periodo: Periodo;
  categoria: Categoria;
  ehSugestaoDoChefe: boolean;
  ingredientes: string[];
  imagemBase64?: string;
}