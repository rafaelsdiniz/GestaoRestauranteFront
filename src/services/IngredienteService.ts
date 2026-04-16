import api from "./api";
import type { Ingrediente } from "../types/Ingrediente";
import type { IngredienteRequestDTO } from "../types/dto/ingrediente/IngredienteRequestDTO";

// =========================
// LISTAR
// =========================
export const listarIngredientes = async (): Promise<Ingrediente[]> => {
  const { data } = await api.get<Ingrediente[]>("/ingrediente");
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarIngredientePorId = async (
  id: number
): Promise<Ingrediente> => {
  const { data } = await api.get<Ingrediente>(`/ingrediente/${id}`);
  return data;
};

// =========================
// CRIAR
// =========================
export const criarIngrediente = async (
  dto: IngredienteRequestDTO
): Promise<Ingrediente> => {
  const { data } = await api.post<Ingrediente>("/ingrediente", dto);
  return data;
};

// =========================
// ATUALIZAR
// =========================
export const atualizarIngrediente = async (
  id: number,
  dto: IngredienteRequestDTO
): Promise<Ingrediente> => {
  const { data } = await api.put<Ingrediente>(`/ingrediente/${id}`, dto);
  return data;
};

// =========================
// DELETAR
// =========================
export const deletarIngrediente = async (id: number): Promise<void> => {
  await api.delete(`/ingrediente/${id}`);
};
