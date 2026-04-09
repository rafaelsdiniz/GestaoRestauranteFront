import api from "./api";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { ItemCardapioRequestDTO } from "../types/dto/item-cardapio/ItemCardapioRequestDTO";

// =========================
// LISTAR
// =========================
export const listarItensCardapio = async (): Promise<ItemCardapio[]> => {
  const { data } = await api.get<ItemCardapio[]>("/itemcardapio");
  return data;
};

// =========================
// BUSCAR POR ID
// =========================
export const buscarItemPorId = async (id: number): Promise<ItemCardapio> => {
  const { data } = await api.get<ItemCardapio>(`/itemcardapio/${id}`);
  return data;
};

// =========================
// CRIAR
// =========================
export const criarItemCardapio = async (
  dto: ItemCardapioRequestDTO
): Promise<ItemCardapio> => {
  const { data } = await api.post<ItemCardapio>("/itemcardapio", dto);
  return data;
};

// =========================
// ATUALIZAR
// =========================
export const atualizarItemCardapio = async (
  id: number,
  dto: ItemCardapioRequestDTO
): Promise<ItemCardapio> => {
  const { data } = await api.put<ItemCardapio>(
    `/itemcardapio/${id}`,
    dto
  );
  return data;
};

// =========================
// DELETAR
// =========================
export const deletarItemCardapio = async (id: number): Promise<void> => {
  await api.delete(`/itemcardapio/${id}`);
};