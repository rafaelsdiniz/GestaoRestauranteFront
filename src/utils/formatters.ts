import type { Endereco } from "../types/Endereco";
import type { Periodo } from "../types/enums/Periodo";
import { Periodo as PeriodoEnum } from "../types/enums/Periodo";
import type { StatusReserva } from "../types/enums/StatusReserva";
import { StatusReserva as StatusReservaEnum } from "../types/enums/StatusReserva";
import type { TipoAgendamento } from "../types/enums/TipoAgendamento";
import { TipoAgendamento as TipoAgendamentoEnum } from "../types/enums/TipoAgendamento";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const twoDigits = (value: number) => value.toString().padStart(2, "0");

export const formatCurrency = (value: number) =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return dateFormatter.format(parsedDate);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(parsedDate);
};

export const getPeriodoLabel = (periodo?: Periodo | number | string) => {
  if (periodo === PeriodoEnum.Almoco || periodo === "1") {
    return "Almoco";
  }

  if (periodo === PeriodoEnum.Jantar || periodo === "2") {
    return "Jantar";
  }

  if (typeof periodo === "string") {
    const normalized = periodo.toLowerCase();

    if (normalized.includes("alm")) {
      return "Almoco";
    }

    if (normalized.includes("jant")) {
      return "Jantar";
    }

    return periodo;
  }

  return "Nao definido";
};

export const getTipoAtendimentoLabel = (
  tipo?: TipoAgendamento | number | string
) => {
  if (tipo === TipoAgendamentoEnum.AtendimentoPresencial || tipo === "1") {
    return "Presencial";
  }

  if (tipo === TipoAgendamentoEnum.DeliveryProprio || tipo === "2") {
    return "Delivery proprio";
  }

  if (tipo === TipoAgendamentoEnum.DeliveryAplicativo || tipo === "3") {
    return "Delivery por aplicativo";
  }

  if (typeof tipo === "string") {
    const normalized = tipo.toLowerCase();

    if (normalized.includes("presenc")) {
      return "Presencial";
    }

    if (normalized.includes("propri")) {
      return "Delivery proprio";
    }

    if (normalized.includes("aplic")) {
      return "Delivery por aplicativo";
    }

    if (normalized.includes("delivery")) {
      return "Delivery";
    }

    return tipo;
  }

  return "Nao informado";
};

export const getStatusReservaLabel = (
  status?: StatusReserva | number | string
) => {
  if (status === StatusReservaEnum.Ativa || status === "1") {
    return "Ativa";
  }

  if (status === StatusReservaEnum.Cancelada || status === "2") {
    return "Cancelada";
  }

  if (status === StatusReservaEnum.Finalizada || status === "3") {
    return "Finalizada";
  }

  if (status === StatusReservaEnum.Confirmada || status === "4") {
    return "Confirmada";
  }

  if (typeof status === "string") {
    return status;
  }

  return "Pendente";
};

export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;

export const toDatetimeLocalValue = (date: Date) =>
  `${toDateInputValue(date)}T${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;

export const formatAddress = (endereco: Endereco) =>
  `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`;

export const isSameDate = (left?: string, right?: string) => {
  if (!left || !right) {
    return false;
  }

  return left.slice(0, 10) === right.slice(0, 10);
};

// Funções adicionais conforme GuiaFront.md
export const formatarPreco = (valor: number): string =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarData = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });

// Alias para compatibilidade
export const formatPrice = formatarPreco;
export const formatDateFull = formatarData;
