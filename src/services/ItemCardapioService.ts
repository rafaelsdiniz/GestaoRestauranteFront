import api from "./api";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { ItemCardapioRequestDTO } from "../types/dto/item-cardapio/ItemCardapioRequestDTO";

export const listarItensCardapio = async () => {
  const { data } = await api.get<ItemCardapio[]>("/itemcardapio");
  return data;
};

export const buscarItemPorId = async (id: number) => {
  const { data } = await api.get<ItemCardapio>(`/itemcardapio/${id}`);
  return data;
};

export const criarItemCardapio = async (dto: ItemCardapioRequestDTO) => {
  const { data } = await api.post<ItemCardapio>("/itemcardapio", dto);
  return data;
};

export const atualizarItemCardapio = async (
  id: number,
  dto: ItemCardapioRequestDTO
) => {
  const { data } = await api.put<ItemCardapio>(
    `/itens-cardapio/${id}`,
    dto
  );
  return data;
};

export const deletarItemCardapio = async (id: number) => {
  const { data } = await api.delete<boolean>(`/itemcardapio/${id}`);
  return data;
};