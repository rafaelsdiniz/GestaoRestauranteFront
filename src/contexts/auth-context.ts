import { createContext } from "react";
import type { LoginRequestDTO } from "../types/dto/auth/LoginRequestDTO";
import type { LoginResponse } from "../types/Login";

export interface AuthContextType {
  token: string | null;
  usuario: LoginResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReady: boolean;
  login: (dto: LoginRequestDTO) => Promise<LoginResponse>;
  logout: () => void;
  updateUsuario: (partial: Partial<LoginResponse>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
