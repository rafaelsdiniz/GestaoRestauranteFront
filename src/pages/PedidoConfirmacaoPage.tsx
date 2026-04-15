import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import type { Pedido } from "../types/Pedido";
import {
  formatCurrency,
  formatDateTime,
  getPeriodoLabel,
  getTipoAtendimentoLabel,
} from "../utils/formatters";

interface ConfirmacaoState {
  pedido?: Pedido;
  metodoPagamento?: string;
  viaApp?: boolean;
  nomeAplicativo?: string;
}

const labelMetodo: Record<string, string> = {
  pix: "Pix",
  credito: "Cartao de credito",
  debito: "Cartao de debito",
  dinheiro: "Dinheiro",
};

const PedidoConfirmacaoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as ConfirmacaoState | null) ?? {};
  const { pedido, metodoPagamento, viaApp, nomeAplicativo } = state;

  if (!pedido) {
    return <Navigate to="/cardapio" replace />;
  }

  const isDeliveryProprio = !!metodoPagamento;

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Confirmacao</span>
          <h1>Pedido confirmado!</h1>
          <p className="hero__lead">
            Seu pedido #{pedido.id} foi registrado com sucesso.
            {viaApp && nomeAplicativo
              ? ` Acompanhe a entrega pelo ${nomeAplicativo}.`
              : isDeliveryProprio
                ? " Pagamento realizado. Acompanhe o status da entrega."
                : ""}
          </p>
        </div>
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Resumo do pedido</span>
            <h2>Pedido #{pedido.id}</h2>
          </div>
        </div>

        <div className="summary-list">
          <div>
            <span>Data</span>
            <strong>{formatDateTime(pedido.dataHora)}</strong>
          </div>
          <div>
            <span>Periodo</span>
            <strong>{getPeriodoLabel(pedido.periodo)}</strong>
          </div>
          <div>
            <span>Atendimento</span>
            <strong>{getTipoAtendimentoLabel(pedido.tipoAtendimento)}</strong>
          </div>
          {metodoPagamento && (
            <div>
              <span>Pagamento</span>
              <strong>{labelMetodo[metodoPagamento] ?? metodoPagamento}</strong>
            </div>
          )}
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(pedido.subtotal)}</strong>
          </div>
          {pedido.desconto > 0 && (
            <div>
              <span>Desconto</span>
              <strong>-{formatCurrency(pedido.desconto)}</strong>
            </div>
          )}
          <div>
            <span>Taxa de entrega</span>
            <strong>{formatCurrency(pedido.taxaEntrega)}</strong>
          </div>
          <div className="summary-list__total">
            <span>Total</span>
            <strong>{formatCurrency(pedido.total)}</strong>
          </div>
        </div>

        <div className="tag-list">
          {(pedido.itens ?? []).map((item, index) => (
            <span className="tag" key={index}>
              {typeof item === "string" ? item : `${item.quantidade}x ${item.nomeItem}`}
            </span>
          ))}
        </div>
      </section>

      {/* Via app: message */}
      {viaApp && nomeAplicativo && (
        <section className="panel panel--section">
          <div className="empty-state">
            <p style={{ fontSize: "1rem" }}>
              Acompanhe a entrega e o pagamento diretamente pelo <strong>{nomeAplicativo}</strong>.
            </p>
          </div>
        </section>
      )}

      <div className="confirmation-actions">
        <button className="button button--primary" onClick={() => navigate("/cardapio")} type="button">
          Fazer novo pedido
        </button>

        {isDeliveryProprio && (
          <button
            className="button button--secondary"
            onClick={() => navigate(`/pedidos/${pedido.id}/acompanhamento`)}
            type="button"
          >
            Acompanhar pedido
          </button>
        )}

        <button
          className="button button--secondary"
          onClick={() => navigate("/perfil", { state: { tab: "pedidos" } })}
          type="button"
        >
          Ver meus pedidos
        </button>
      </div>
    </AppShell>
  );
};

export default PedidoConfirmacaoPage;
