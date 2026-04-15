import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import type { Reserva } from "../types/Reserva";
import { formatDateTime, getStatusReservaLabel } from "../utils/formatters";

const ReservaConfirmacaoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reserva = (location.state as { reserva?: Reserva } | null)?.reserva;

  if (!reserva) {
    return <Navigate to="/reservas" replace />;
  }

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Confirmacao</span>
          <h1>Reserva confirmada!</h1>
          <p className="hero__lead">
            Sua reserva #{reserva.id} foi registrada com sucesso. Confira os detalhes abaixo.
          </p>
        </div>
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Detalhes da reserva</span>
            <h2>Reserva #{reserva.id}</h2>
          </div>
        </div>

        <div className="summary-list">
          <div>
            <span>Data e horario</span>
            <strong>{formatDateTime(reserva.dataHoraReserva)}</strong>
          </div>
          <div>
            <span>Pessoas</span>
            <strong>{reserva.quantidadePessoas}</strong>
          </div>
          <div>
            <span>Mesa</span>
            <strong>{reserva.numeroMesa}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{getStatusReservaLabel(reserva.statusReserva)}</strong>
          </div>
          {reserva.codigoConfirmacao ? (
            <div className="summary-list__total">
              <span>Codigo de confirmacao</span>
              <strong>{reserva.codigoConfirmacao}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <div className="confirmation-actions">
        <button className="button button--primary" onClick={() => navigate("/reservas")} type="button">
          Fazer nova reserva
        </button>
        <button className="button button--secondary" onClick={() => navigate("/perfil", { state: { tab: "reservas" } })} type="button">
          Ver minhas reservas
        </button>
      </div>
    </AppShell>
  );
};

export default ReservaConfirmacaoPage;
