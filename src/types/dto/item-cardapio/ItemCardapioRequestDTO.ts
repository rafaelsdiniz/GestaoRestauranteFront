import type { Categoria } from "../../enums/Categoria";
import type { Periodo } from "../../enums/Periodo";

export interface ItemCardapioRequestDTO {
  nome: string;
  descricao: string;
  precoBase: number;
  periodo: Periodo;
  categoria: Categoria;
  ingredientesIds?: number[];
  imagemBase64?: string;
}