import type { BaseEntity } from "./BaseEntity";
import type { TipoAgendamento } from "./enums/TipoAgendamento";

export interface Atendimento extends BaseEntity {
  tipoAtendimento: TipoAgendamento;
  dataHora: string;
  taxaEntrega: number;
}