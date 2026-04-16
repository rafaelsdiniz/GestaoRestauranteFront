import api from "./api";

export interface ConfiguracaoRestauranteDTO {
  almocoInicio: string;
  almocoFim: string;
  jantarInicio: string;
  jantarFim: string;
  reservaInicio: string;
  reservaFim: string;
  antecedenciaMinimaDias: number;
}

export interface HorariosPublicosDTO {
  almocoInicio: string;
  almocoFim: string;
  jantarInicio: string;
  jantarFim: string;
  reservaInicio: string;
  reservaFim: string;
  antecedenciaMinimaDias: number;
}

// Admin — buscar configuracao completa
export const getConfiguracoes = async (): Promise<ConfiguracaoRestauranteDTO> => {
  const { data } = await api.get<ConfiguracaoRestauranteDTO>("/admin/configuracoes");
  return data;
};

// Admin — atualizar configuracao
export const atualizarConfiguracoes = async (
  dto: ConfiguracaoRestauranteDTO
): Promise<ConfiguracaoRestauranteDTO> => {
  const { data } = await api.put<ConfiguracaoRestauranteDTO>("/admin/configuracoes", dto);
  return data;
};

// Publico — buscar horarios para o cliente
export const getHorariosPublicos = async (): Promise<HorariosPublicosDTO> => {
  const { data } = await api.get<HorariosPublicosDTO>("/configuracoes/horarios");
  return data;
};
