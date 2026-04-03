import api from "./api";
import type { Usuario } from "../types/Usuario";
import type { UsuarioRequestDTO } from "../types/dto/usuario/UsuarioRequestDTO";

export const criarUsuario = async (dto: UsuarioRequestDTO) => {
  const { data } = await api.post<Usuario>("/usuarios", dto);
  return data;
};

export const listarUsuarios = async () => {
  const { data } = await api.get<Usuario[]>("/usuarios");
  return data;
};

export const buscarUsuarioPorId = async (id: number) => {
  const { data } = await api.get<Usuario>(`/usuarios/${id}`);
  return data;
};

export const atualizarUsuario = async (id: number, dto: UsuarioRequestDTO) => {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, dto);
  return data;
};

export const deletarUsuario = async (id: number) => {
  await api.delete(`/usuarios/${id}`);
};