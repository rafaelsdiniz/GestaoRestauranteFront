import api from "./api";
import type {
  LoginRequestDTO,
  LoginResponse,
  CadastroRequestDTO,
  CadastroResponseDTO,
} from "../types/Login";

// =========================
// LOGIN
// =========================
export const login = async (dto: LoginRequestDTO): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", dto);

  // Normalizar resposta para garantir campos consistentes
  const normalized: LoginResponse = {
    ...data,
    nomeUsuario: data.nomeUsuario || data.usuario?.nome || "",
    usuarioId: data.usuarioId || data.usuario?.id || 0,
    email: data.email || data.usuario?.email || "",
    tipoUsuario: data.tipoUsuario || data.usuario?.tipoUsuario || "Cliente",
    admin: data.tipoUsuario === "Administrador" || data.usuario?.tipoUsuario === "Administrador",
    usuario: data.usuario || {
      id: data.usuarioId,
      nome: data.nomeUsuario,
      email: data.email,
      tipoUsuario: data.tipoUsuario || "Cliente",
    },
  };

  return normalized;
};

// =========================
// CADASTRO
// =========================
export const cadastrar = async (
  dto: CadastroRequestDTO
): Promise<CadastroResponseDTO> => {
  const { data } = await api.post<CadastroResponseDTO>("/auth/cadastro", dto);
  return data;
};

// =========================
// LOGOUT
// =========================
export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};
