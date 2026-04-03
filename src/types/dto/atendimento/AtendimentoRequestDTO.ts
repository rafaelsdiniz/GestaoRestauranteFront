import type { TipoAgendamento } from "../../enums/TipoAgendamento";

export interface AtendimentoRequestDTO {
  tipoAtendimento: TipoAgendamento;
  observacaoEntrega?: string;
  nomeAplicativo?: string;
}