import type { BaseEntity } from "./BaseEntity";

export interface Usuario extends BaseEntity {
    nome : string;
    email : string;

}