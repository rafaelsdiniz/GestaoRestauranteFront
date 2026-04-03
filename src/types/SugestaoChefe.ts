import type { BaseEntity } from "./BaseEntity";
import type { Periodo } from "./enums/Periodo";

export interface SugestaoChefe extends BaseEntity {
    dataSugestao: string;
    periodo: Periodo;
    nomeItem: string;
}