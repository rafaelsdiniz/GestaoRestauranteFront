import type { BaseEntity } from "./BaseEntity";

export interface Ingrediente extends BaseEntity {
  nome: string;
  descricao?: string;
}