import api from "./api";
import type { Endereco } from "../types/Endereco";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";

export const criarEndereco = async (usuarioId: number, dto: EnderecoRequestDTO) => {
  const { data } = await api.post<Endereco>(`/enderecos/${usuarioId}`, dto);
  return data;
};

export const listarEnderecos = async (usuarioId: number) => {
  const { data } = await api.get<Endereco[]>(`/enderecos/usuario/${usuarioId}`);
  return data;
};

export const buscarEnderecoPorId = async (id: number) => {
  const { data } = await api.get<Endereco>(`/enderecos/${id}`);
  return data;
};

export const atualizarEndereco = async (id: number, dto: EnderecoRequestDTO) => {
  const { data } = await api.put<Endereco>(`/enderecos/${id}`, dto);
  return data;
};

export const deletarEndereco = async (id: number) => {
  const { data } = await api.delete<boolean>(`/enderecos/${id}`);
  return data;
};