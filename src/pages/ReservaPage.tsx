import { useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { listarMesasDisponiveis } from "../services/MesaService";
import { cancelarReserva, criarReserva, listarReservasDoUsuario } from "../services/ReservaService";
import type { Mesa } from "../types/Mesa";
import type { Reserva } from "../types/Reserva";
import { StatusReserva } from "../types/enums/StatusReserva";
import { getErrorMessage } from "../utils/error";
import {
  formatDateTime,
  getStatusReservaLabel,
  toDatetimeLocalValue,
} from "../utils/formatters";

const getDefaultReservationDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  return toDatetimeLocalValue(date);
};

const ReservaPage = () => {
  const { usuario } = useAuth();
  const [dataHora, setDataHora] = useState(getDefaultReservationDate());
  const [pessoas, setPessoas] = useState(2);
  const [mesaId, setMesaId] = useState(0);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      const [mesasResult, reservasResult] = await Promise.allSettled([
        listarMesasDisponiveis(),
        usuario?.usuario?.id
          ? listarReservasDoUsuario(usuario.usuario.id)
          : Promise.resolve([]),
      ]);

      if (!isMounted) return;

      if (mesasResult.status === "fulfilled") {
        setMesas(mesasResult.value);
        if (mesasResult.value.length > 0 && mesaId === 0) {
          setMesaId(mesasResult.value[0].id);
        }
      } else {
        setError(
          getErrorMessage(
            mesasResult.reason,
            "Nao foi possivel carregar as mesas disponiveis."
          )
        );
      }

      if (reservasResult.status === "fulfilled") {
        setReservas(reservasResult.value);
      } else {
        setError(
          getErrorMessage(
            reservasResult.reason,
            "Nao foi possivel carregar o historico de reservas."
          )
        );
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [usuario?.usuario?.id]);

  const reservasDoUsuario = useMemo(() => {
    return reservas.sort(
      (left, right) =>
        new Date(left.dataHoraReserva).getTime() -
        new Date(right.dataHoraReserva).getTime()
    );
  }, [reservas]);

  const selectedTable = mesas.find((table) => table.id === mesaId);

  const validateReservation = () => {
    const reservationDate = new Date(dataHora);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservationHour =
      reservationDate.getHours() + reservationDate.getMinutes() / 60;

    if (Number.isNaN(reservationDate.getTime())) {
      return "Selecione uma data e horario validos.";
    }

    if (reservationDate < tomorrow) {
      return "A reserva precisa ter pelo menos um dia de antecedencia.";
    }

    if (reservationHour < 19 || reservationHour > 22) {
      return "As reservas estao limitadas ao jantar, entre 19h e 22h.";
    }

    if (selectedTable && pessoas > selectedTable.capacidade) {
      return "A quantidade de pessoas excede a capacidade da mesa escolhida.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationMessage = validateReservation();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!usuario) {
      setError("Nenhum usuario autenticado foi encontrado.");
      return;
    }

    setIsSubmitting(true);

    try {
      const novaReserva = await criarReserva(usuario?.usuario?.id, {
        dataHoraReserva: dataHora,
        quantidadePessoas: pessoas,
        mesaId,
      });

      setReservas((previous) => [...previous, novaReserva]);
      setSuccess("Reserva criada com sucesso para o jantar.");
      setDataHora(getDefaultReservationDate());
      setPessoas(2);
      setMesaId(3);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Nao foi possivel concluir a reserva. Verifique as regras de horario."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    setError("");
    setSuccess("");

    try {
      if (!usuario?.usuario?.id) {
        throw new Error("Usuário não autenticado.");
      }
      await cancelarReserva(usuario.usuario.id, reservationId);

      setReservas((previous) =>
        previous.map((reserva) =>
          reserva.id === reservationId
            ? { ...reserva, statusReserva: StatusReserva.Cancelada }
            : reserva
        )
      );

      setSuccess("Reserva cancelada com sucesso.");
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Nao foi possivel cancelar essa reserva agora."
        )
      );
    }
  };

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Reservas</span>
          <h1>Reserve sua mesa</h1>
          <p className="hero__lead">
            Agende uma mesa para o jantar entre 19h e 22h com pelo menos
            um dia de antecedencia. Escolha a mesa pela capacidade.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Nova reserva</span>
              <h2>Agendar jantar</h2>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field field--full">
              <span>Data e horario</span>
              <input
                onChange={(event) => setDataHora(event.target.value)}
                required
                type="datetime-local"
                value={dataHora}
              />
            </label>

            <label className="field">
              <span>Pessoas</span>
              <input
                max={10}
                min={1}
                onChange={(event) => setPessoas(Number(event.target.value))}
                required
                type="number"
                value={pessoas}
              />
            </label>

            <label className="field">
              <span>Mesa</span>
              <select
                onChange={(event) => setMesaId(Number(event.target.value))}
                value={mesaId}
              >
                {mesas.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.numero} | {table.capacidade} lugares
                  </option>
                ))}
              </select>
            </label>

            <div className="panel panel--soft field--full">
              <div className="summary-list summary-list--compact">
                <div>
                  <span>Janela valida</span>
                  <strong>19h ate 22h</strong>
                </div>
                <div>
                  <span>Antecedencia</span>
                  <strong>Minimo de 1 dia</strong>
                </div>
                <div>
                  <span>Mesa escolhida</span>
                  <strong>
                    {selectedTable
                      ? `Mesa ${selectedTable.numero} | ${selectedTable.capacidade} lugares`
                      : "Nao selecionada"}
                  </strong>
                </div>
              </div>
            </div>

            <button className="button button--primary button--block field--full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando reserva..." : "Confirmar reserva"}
            </button>
          </form>
        </section>

        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Regras</span>
              <h2>Informacoes importantes</h2>
            </div>
          </div>

          <div className="rule-list">
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Reserva focada no jantar, com horario entre 19h e 22h.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Antecedencia minima de um dia para respeitar a regra de negocio.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Capacidade da mesa visivel antes do envio para evitar conflito.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Historico mostra status, codigo e botao de cancelamento quando aplicavel.</p>
            </div>
          </div>
        </section>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Historico do cliente</span>
            <h2>Reservas registradas</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando reservas...</p>
          </div>
        ) : reservasDoUsuario.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma reserva encontrada para o usuario autenticado.</p>
          </div>
        ) : (
          <div className="history-list">
            {reservasDoUsuario.map((reserva) => {
              const isCancelable =
                reserva.statusReserva === StatusReserva.Ativa ||
                reserva.statusReserva === StatusReserva.Confirmada;

              return (
                <article className="history-card" key={reserva.id}>
                  <div className="history-card__header">
                    <div>
                      <strong>Reserva #{reserva.id}</strong>
                      <span>{formatDateTime(reserva.dataHoraReserva)}</span>
                    </div>

                    <span className="pill pill--outline">
                      {getStatusReservaLabel(reserva.statusReserva)}
                    </span>
                  </div>

                  <div className="summary-list summary-list--compact">
                    <div>
                      <span>Pessoas</span>
                      <strong>{reserva.quantidadePessoas}</strong>
                    </div>
                    <div>
                      <span>Mesa</span>
                      <strong>{reserva.numeroMesa}</strong>
                    </div>
                    <div>
                      <span>Codigo</span>
                      <strong>{reserva.codigoConfirmacao ?? "Nao informado"}</strong>
                    </div>
                  </div>

                  {isCancelable ? (
                    <button
                      className="button button--ghost"
                      onClick={() => handleCancelReservation(reserva.id)}
                      type="button"
                    >
                      Cancelar reserva
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default ReservaPage;
