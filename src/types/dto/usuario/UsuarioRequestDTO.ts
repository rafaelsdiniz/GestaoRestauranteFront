export interface UsuarioRequestDTO {
  nome: string;
  email: string;
  senha: string;
  senhaAtual?: string;
}