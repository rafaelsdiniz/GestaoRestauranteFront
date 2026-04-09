import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5252/api",
});

api.interceptors.request.use((config) => {
  const isLoginRequest = config.url?.includes("/auth/login");

  if (!isLoginRequest) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Interceptor de resposta para tratar erros de autenticação (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpar dados de autenticação
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      // Redirecionar para login se não estiver na página de login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
