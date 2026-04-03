import type { Periodo } from "../../enums/Periodo";

export interface ItemCardapioRequestDTO {
  nome: string;
  descricao: string;
  precoBase: number;
  periodo: Periodo;
  ingredientesIds?: number[];
}