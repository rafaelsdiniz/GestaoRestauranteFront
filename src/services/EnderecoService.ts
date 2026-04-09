import api from "./api";
import type { Endereco } from "../types/Endereco";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";

// Listar todos os endereços do usuário
export const listarEnderecosDoUsuario = async (
  usuarioId: number
): Promise<Endereco[]> => {
  const { data } = await api.get<Endereco[]>(`/usuarios/${usuarioId}/enderecos`);
  return data;
};

// Buscar endereço por id
export const buscarEnderecoPorId = async (
  usuarioId: number,
  id: number
): Promise<Endereco> => {
  const { data } = await api.get<Endereco>(`/usuarios/${usuarioId}/enderecos/${id}`);
  return data;
};

// Criar endereço
export const criarEndereco = async (
  usuarioId: number,
  dto: EnderecoRequestDTO
): Promise<Endereco> => {
  const { data } = await api.post<Endereco>(`/usuarios/${usuarioId}/enderecos`, dto);
  return data;
};

// Atualizar endereço
export const atualizarEndereco = async (
  usuarioId: number,
  id: number,
  dto: EnderecoRequestDTO
): Promise<Endereco> => {
  const { data } = await api.put<Endereco>(`/usuarios/${usuarioId}/enderecos/${id}`, dto);
  return data;
};

// Deletar endereço
export const deletarEndereco = async (
  usuarioId: number,
  id: number
): Promise<void> => {
  await api.delete(`/usuarios/${usuarioId}/enderecos/${id}`);
};