import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { listarMesasDisponiveis } from "../services/MesaService";
import { criarReserva } from "../services/ReservaService";
import { getHorariosPublicos, type HorariosPublicosDTO } from "../services/ConfiguracaoService";
import type { Mesa } from "../types/Mesa";
import { getErrorMessage } from "../utils/error";
import { toDatetimeLocalValue } from "../utils/formatters";

const getDefaultReservationDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);
  return toDatetimeLocalValue(date);
};

const ReservaPage = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const usuarioId = usuario?.usuario?.id ?? usuario?.usuarioId;
  const [dataHora, setDataHora] = useState(getDefaultReservationDate());
  const [pessoas, setPessoas] = useState(2);
  const [mesaId, setMesaId] = useState(0);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [horarios, setHorarios] = useState<HorariosPublicosDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [mesasData, horariosData] = await Promise.all([
          listarMesasDisponiveis(),
          getHorariosPublicos(),
        ]);
        if (!isMounted) return;
        setMesas(mesasData);
        setHorarios(horariosData);
        if (mesasData.length > 0 && mesaId === 0) {
          setMesaId(mesasData[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          getErrorMessage(err, "Nao foi possivel carregar os dados.")
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTable = mesas.find((table) => table.id === mesaId);

  const parseTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  };

  const reservaInicio = horarios ? parseTime(horarios.reservaInicio) : 11;
  const reservaFim = horarios ? parseTime(horarios.reservaFim) : 14;
  const antecedenciaDias = horarios?.antecedenciaMinimaDias ?? 1;

  const validateReservation = () => {
    const reservationDate = new Date(dataHora);
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + antecedenciaDias);

    const reservationHour =
      reservationDate.getHours() + reservationDate.getMinutes() / 60;

    if (Number.isNaN(reservationDate.getTime())) {
      return "Selecione uma data e horario validos.";
    }

    if (reservationDate < minDate) {
      return `A reserva precisa ter pelo menos ${antecedenciaDias} dia(s) de antecedencia.`;
    }

    if (reservationHour < reservaInicio || reservationHour > reservaFim) {
      return `As reservas estao disponiveis entre ${horarios?.reservaInicio ?? "11:00"} e ${horarios?.reservaFim ?? "14:00"}.`;
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
      const novaReserva = await criarReserva(usuarioId!, {
        dataHoraReserva: dataHora,
        quantidadePessoas: pessoas,
        mesaId,
      });

      navigate("/reservas/confirmacao", { state: { reserva: novaReserva } });
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

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Reservas</span>
          <h1>Reserve sua mesa</h1>
          <p className="hero__lead">
            Agende uma mesa entre {horarios?.reservaInicio ?? "11:00"} e {horarios?.reservaFim ?? "14:00"} com pelo menos{" "}
            {antecedenciaDias} dia(s) de antecedencia. Escolha a mesa pela capacidade.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Nova reserva</span>
              <h2>Agendar almoco</h2>
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
                  <strong>{horarios?.reservaInicio ?? "11:00"} ate {horarios?.reservaFim ?? "14:00"}</strong>
                </div>
                <div>
                  <span>Antecedencia</span>
                  <strong>Minimo de {antecedenciaDias} dia(s)</strong>
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

            <button className="button button--primary button--block field--full" disabled={isLoading || isSubmitting} type="submit">
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
              <p>Reservas disponiveis entre {horarios?.reservaInicio ?? "11:00"} e {horarios?.reservaFim ?? "14:00"}.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Antecedencia minima de {antecedenciaDias} dia(s) para respeitar a regra de negocio.</p>
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
    </AppShell>
  );
};

export default ReservaPage;
