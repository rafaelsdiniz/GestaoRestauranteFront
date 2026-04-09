export interface LoginRequestDTO {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  nomeUsuario: string;
  email: string;
  usuarioId: number;
  tipoUsuario: string;
  admin?: boolean;

  // objeto normalizado para uso nas pages
  usuario?: {
    id: number;
    nome: string;
    email: string;
    tipoUsuario: string;
  };
}

export interface CadastroRequestDTO {
  nome: string;
  email: string;
  senha: string;
}

export interface CadastroResponseDTO {
  id: number;
  nome: string;
  email: string;
}
