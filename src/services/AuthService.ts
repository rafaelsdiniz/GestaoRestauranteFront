import api from "./api";
import type { LoginResponse } from "../types/Login";

interface LoginRequestDTO {
  email: string;
  senha: string;
}

export const login = async (dto: LoginRequestDTO) => {
  const { data } = await api.post<LoginResponse>("/auth/login", dto);
  return data;
}