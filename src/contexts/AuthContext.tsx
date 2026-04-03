import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./auth-context";
import { login as loginRequest } from "../services/AuthService";
import type { LoginRequestDTO } from "../types/dto/auth/LoginRequestDTO";
import type { LoginResponse } from "../types/Login";

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "token";
const USER_KEY = "usuario";

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
};

const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const usuarioSalvo = localStorage.getItem(USER_KEY);

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo) as LoginResponse;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [usuario, setUsuario] = useState<LoginResponse | null>(getStoredUser);

  const login = useCallback(async (dto: LoginRequestDTO) => {
    const response = await loginRequest(dto);

    setToken(response.token);
    setUsuario(response);

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsuario(null);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      usuario,
      isAuthenticated: !!token,
      isReady: true,
      login,
      logout,
    }),
    [login, logout, token, usuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
