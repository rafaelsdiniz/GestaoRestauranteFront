import api from "./api";
import type { Usuario } from "../types/Usuario";
import type { UsuarioRequestDTO } from "../types/dto/usuario/UsuarioRequestDTO";

// =========================
// CRIAR
// =========================
export const criarUsuario = async (
  dto: UsuarioRequestDTO
): Promise<Usuario> => {
  const { data } = await api.post<Usuario>("/usuario", dto);
  return data;
};

// =========================
// LISTAR
// =========================
export const listarUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await api.get<Usuario[]>("/usuario");
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarUsuarioPorId = async (id: number): Promise<Usuario> => {
  const { data } = await api.get<Usuario>(`/usuario/${id}`);
  return data;
};

// =========================
// ATUALIZAR
// =========================
export const atualizarUsuario = async (
  id: number,
  dto: UsuarioRequestDTO
): Promise<Usuario> => {
  const { data } = await api.put<Usuario>(`/usuario/${id}`, dto);
  return data;
};

// =========================
// DELETAR
// =========================
export const deletarUsuario = async (id: number): Promise<void> => {
  await api.delete(`/usuario/${id}`);
};