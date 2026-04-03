import api from "./api";

export const faturamentoPorTipo = async (dataInicio: string, dataFim: string) => {
  const { data } = await api.get("/relatorios/faturamento", {
    params: { dataInicio, dataFim },
  });

  return data;
};

export const itensMaisVendidos = async () => {
  const { data } = await api.get("/relatorios/itens-mais-vendidos");
  return data;
};