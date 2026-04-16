import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { buscarPedidoPorId } from "../services/PedidoService";
import type { Pedido } from "../types/Pedido";
import { StatusPedido, labelStatusPedido } from "../types/enums/StatusPedido";
import { getErrorMessage } from "../utils/error";
import { formatCurrency, formatDateTime, getTipoAtendimentoLabel } from "../utils/formatters";

const trackingSteps = [
  { key: StatusPedido.Recebido, label: "Recebido" },
  { key: StatusPedido.EmPreparo, label: "Em Preparo" },
  { key: StatusPedido.Pronto, label: "Pronto" },
  { key: StatusPedido.ACaminho, label: "A Caminho" },
  { key: StatusPedido.Entregue, label: "Entregue" },
];

const statusOrder: StatusPedido[] = [
  StatusPedido.Recebido,
  StatusPedido.EmPreparo,
  StatusPedido.Pronto,
  StatusPedido.ACaminho,
  StatusPedido.Entregue,
];

const PedidoAcompanhamentoPage = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const usuarioId = usuario?.usuario?.id ?? usuario?.usuarioId;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPedido = async () => {
    if (!usuarioId || !id) return;
    try {
      const data = await buscarPedidoPorId(usuarioId, Number(id));
      setPedido(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Nao foi possivel carregar o pedido."));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPedido();
  }, [usuarioId, id]);

  // Polling every 15s
  useEffect(() => {
    if (!usuarioId || !id) return;
    const isFinal = pedido?.status === StatusPedido.Entregue || pedido?.status === StatusPedido.Cancelado;
    if (isFinal) return;

    const interval = setInterval(fetchPedido, 15000);
    return () => clearInterval(interval);
  }, [usuarioId, id, pedido?.status]);

  const currentStatus = pedido?.status ?? StatusPedido.Recebido;
  const isCancelled = currentStatus === StatusPedido.Cancelado;
  const currentIndex = statusOrder.indexOf(currentStatus as StatusPedido);

  if (isLoading) {
    return (
      <AppShell contentClassName="page">
        <div className="loading-state panel">
          <span className="route-status__spinner" />
          <p>Carregando pedido...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !pedido) {
    return (
      <AppShell contentClassName="page">
        <div className="message message--error">{error || "Pedido nao encontrado."}</div>
        <button className="button button--secondary" onClick={() => navigate("/perfil", { state: { tab: "pedidos" } })} type="button">
          Voltar aos meus pedidos
        </button>
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Acompanhamento</span>
          <h1>Pedido #{pedido.id}</h1>
          <p className="hero__lead">
            {isCancelled
              ? "Este pedido foi cancelado."
              : currentStatus === StatusPedido.Entregue
                ? "Seu pedido foi entregue!"
                : "Acompanhe o status do seu pedido em tempo real."}
          </p>
        </div>
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Status</span>
            <h2>{labelStatusPedido[currentStatus] ?? currentStatus}</h2>
          </div>
          {!isCancelled && currentStatus !== StatusPedido.Entregue && (
            <span className="pill pill--gold">Atualiza automaticamente</span>
          )}
        </div>

        {isCancelled ? (
          <div className="tracking-timeline tracking-timeline--cancelled">
            <div className="tracking-step tracking-step--cancelled">
              <div className="tracking-step__dot" />
              <div className="tracking-step__content">
                <strong>Pedido cancelado</strong>
                <p>Este pedido nao sera mais processado.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="tracking-timeline">
            {trackingSteps.map((step, index) => {
              const isDone = index <= currentIndex;
              const isActive = index === currentIndex;

              return (
                <div
                  key={step.key}
                  className={`tracking-step${isDone ? " tracking-step--done" : ""}${isActive ? " tracking-step--active" : ""}`}
                >
                  <div className="tracking-step__dot" />
                  <div className="tracking-step__content">
                    <strong>{step.label}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Detalhes</span>
            <h2>Resumo do pedido</h2>
          </div>
        </div>

        <div className="summary-list">
          <div>
            <span>Data</span>
            <strong>{formatDateTime(pedido.dataHora)}</strong>
          </div>
          <div>
            <span>Atendimento</span>
            <strong>{getTipoAtendimentoLabel(pedido.tipoAtendimento)}</strong>
          </div>
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
            <span>Taxa</span>
            <strong>{formatCurrency(pedido.taxaEntrega)}</strong>
          </div>
          <div className="summary-list__total">
            <span>Total</span>
            <strong>{formatCurrency(pedido.total)}</strong>
          </div>
        </div>

        <div className="tag-list">
          {(pedido.itens ?? []).map((item, i) => (
            <span className="tag" key={i}>
              {typeof item === "string" ? item : `${item.quantidade}x ${item.nomeItem}`}
            </span>
          ))}
        </div>
      </section>

      <div className="confirmation-actions">
        <button className="button button--secondary" onClick={() => navigate("/perfil", { state: { tab: "pedidos" } })} type="button">
          Meus pedidos
        </button>
        <button className="button button--primary" onClick={() => navigate("/cardapio")} type="button">
          Novo pedido
        </button>
      </div>
    </AppShell>
  );
};

export default PedidoAcompanhamentoPage;
