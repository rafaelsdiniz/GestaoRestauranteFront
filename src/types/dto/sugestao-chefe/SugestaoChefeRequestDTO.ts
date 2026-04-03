import type { Periodo } from "../../enums/Periodo";

export interface SugestaoChefeRequestDTO {
  dataSugestao: string;
  periodo: Periodo;
  itemCardapioId: number;
}