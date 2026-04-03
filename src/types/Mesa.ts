import type { BaseEntity } from "./BaseEntity";

export interface Mesa extends BaseEntity {
  numero: number;
  capacidade: number;
}