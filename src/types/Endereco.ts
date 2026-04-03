import type { BaseEntity } from "./BaseEntity";

export interface Endereco extends BaseEntity {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}