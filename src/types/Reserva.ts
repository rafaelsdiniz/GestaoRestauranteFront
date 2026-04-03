import type { BaseEntity } from "./BaseEntity";
import type { StatusReserva } from "./enums/StatusReserva";


export interface Reserva extends BaseEntity {
  dataHoraReserva: string;
  quantidadePessoas: number;
  statusReserva: StatusReserva;
  codigoConfirmacao?: string;
  nomeUsuario: string;
  numeroMesa: number;
}