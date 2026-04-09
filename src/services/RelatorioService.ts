import api from "./api";

export interface FaturamentoPorTipo {
  tipoAtendimento: string;
  quantidadePedidos: number;
  totalFaturado: number;
}

export interface ItemMaisVendido {
  itemId: number;
  nomeItem: string;
  periodo: string;
  quantidadeVendida: number;
  totalGerado: number;
  ehSugestaoChefe: boolean;
}

export const faturamentoPorTipo = async (
  dataInicio: string,
  dataFim: string
): Promise<FaturamentoPorTipo[]> => {
  const { data } = await api.get<FaturamentoPorTipo[]>("/relatorio/faturamento", {
    params: { dataInicio, dataFim },
  });

  return data;
};

export const itensMaisVendidos = async (): Promise<ItemMaisVendido[]> => {
  const { data } = await api.get<ItemMaisVendido[]>("/relatorio/itens-mais-vendidos");
  return data;
};