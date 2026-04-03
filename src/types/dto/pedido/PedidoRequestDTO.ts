import type { Periodo } from "../../enums/Periodo";

export interface PedidoRequestDTO {
  atendimentoId: number;
  itensIds: number[];
  periodo: Periodo;
}