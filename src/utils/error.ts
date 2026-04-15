import { isAxiosError } from "axios";

export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (
      responseData &&
      typeof responseData === "object"
    ) {
      if (
        "mensagem" in responseData &&
        typeof responseData.mensagem === "string"
      ) {
        return responseData.mensagem;
      }

      if (
        "message" in responseData &&
        typeof responseData.message === "string"
      ) {
        return responseData.message;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
