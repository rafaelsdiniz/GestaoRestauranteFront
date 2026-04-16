import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import AppShell from "../components/AppShell";
import type { Pedido } from "../types/Pedido";
import { formatCurrency } from "../utils/formatters";

type MetodoPagamento = "pix" | "credito" | "debito" | "dinheiro";

const metodosDelivery: { value: MetodoPagamento; title: string; desc: string }[] = [
  { value: "pix", title: "Pix", desc: "Pagamento instantaneo via QR Code" },
  { value: "credito", title: "Cartao de credito", desc: "Parcele em ate 3x sem juros" },
  { value: "debito", title: "Cartao de debito", desc: "Debito direto na conta" },
  { value: "dinheiro", title: "Dinheiro", desc: "Pague na entrega ao entregador" },
];

const metodosPresencial: { value: MetodoPagamento; title: string; desc: string }[] = [
  { value: "pix", title: "Pix", desc: "Pagamento instantaneo via QR Code" },
  { value: "credito", title: "Cartao de credito", desc: "Parcele em ate 3x sem juros" },
  { value: "debito", title: "Cartao de debito", desc: "Debito direto na conta" },
];

const PagamentoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { pedido?: Pedido; presencial?: boolean } | null;
  const pedido = state?.pedido;
  const isPresencial = state?.presencial ?? false;

  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [trocoValue, setTrocoValue] = useState("");

  // Campos simulados de cartao
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const [pixCopied, setPixCopied] = useState(false);

  if (!pedido) {
    return <Navigate to="/cardapio" replace />;
  }

  // Monta payload Pix copia-e-cola (EMV QR Code padrao BCB)
  const buildPixPayload = () => {
    const pixKey = "5563984592035";
    const merchantName = "BRAVO RESTAURANTE";
    const merchantCity = "SAO PAULO";

    const formatField = (id: string, value: string) =>
      `${id}${value.length.toString().padStart(2, "0")}${value}`;

    const merchantAccount =
      formatField("00", "br.gov.bcb.pix") + formatField("01", pixKey);

    let payload =
      formatField("00", "01") + // Payload Format Indicator
      formatField("26", merchantAccount) + // Merchant Account Info
      formatField("52", "0000") + // Merchant Category Code
      formatField("53", "986") + // Transaction Currency (BRL)
      formatField("54", (pedido.total / 100).toFixed(2)) + // Transaction Amount
      formatField("58", "BR") + // Country Code
      formatField("59", merchantName) + // Merchant Name
      formatField("60", merchantCity); // Merchant City

    // CRC16 placeholder — 4 chars
    payload += "6304";

    // Calcula CRC16-CCITT
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    crc &= 0xffff;

    return payload + crc.toString(16).toUpperCase().padStart(4, "0");
  };

  const pixPayload = buildPixPayload();

  const handleCopyPix = () => {
    void navigator.clipboard.writeText(pixPayload);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      navigate("/pedidos/confirmacao", {
        state: { pedido, metodoPagamento: metodo, presencial: isPresencial },
      });
    }, 1500);
  };

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Pagamento</span>
          <h1>Finalizar pagamento</h1>
          <p className="hero__lead">
            Pedido #{pedido.id} - Total de {formatCurrency(pedido.total)}
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Forma de pagamento</span>
              <h2>Escolha como pagar</h2>
            </div>
          </div>

          <div className="payment-methods">
            {(isPresencial ? metodosPresencial : metodosDelivery).map((m) => (
              <button
                key={m.value}
                className={`option-card${metodo === m.value ? " is-active" : ""}`}
                onClick={() => setMetodo(m.value)}
                type="button"
              >
                <strong>{m.title}</strong>
                <p>{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Pix */}
          {metodo === "pix" && (
            <div className="panel panel--soft">
              <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
                <QRCodeSVG
                  value={pixPayload}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="M"
                />
              </div>
              <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--cream-muted)", marginTop: "0.75rem" }}>
                Escaneie o QR Code ou copie o codigo abaixo
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  type="text"
                  readOnly
                  value={pixPayload}
                  style={{ flex: 1, fontSize: "0.78rem" }}
                />
                <button className="button button--secondary" onClick={handleCopyPix} type="button">
                  {pixCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {/* Cartao */}
          {(metodo === "credito" || metodo === "debito") && (
            <div className="form-grid form-grid--two">
              <label className="field field--full">
                <span>Nome no cartao</span>
                <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Como aparece no cartao" />
              </label>
              <label className="field field--full">
                <span>Numero do cartao</span>
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" maxLength={19} />
              </label>
              <label className="field">
                <span>Validade</span>
                <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/AA" maxLength={5} />
              </label>
              <label className="field">
                <span>CVV</span>
                <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="000" maxLength={4} />
              </label>
            </div>
          )}

          {/* Dinheiro */}
          {metodo === "dinheiro" && (
            <div className="form-grid">
              <label className="field">
                <span>Troco para quanto?</span>
                <input type="text" value={trocoValue} onChange={(e) => setTrocoValue(e.target.value)} placeholder="Ex: R$ 100,00 (deixe vazio se nao precisa)" />
              </label>
              <p style={{ fontSize: "0.85rem", color: "var(--cream-muted)" }}>
                O entregador levara o troco necessario.
              </p>
            </div>
          )}
        </section>

        <aside className="sidebar-stack">
          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Resumo</span>
                <h2>Pedido #{pedido.id}</h2>
              </div>
            </div>

            <div className="tag-list">
              {(pedido.itens ?? []).map((item, i) => (
                <span className="tag" key={i}>
                  {typeof item === "string" ? item : `${item.quantidade}x ${item.nomeItem}`}
                </span>
              ))}
            </div>

            <div className="summary-list">
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
              {pedido.taxaEntrega > 0 && (
                <div>
                  <span>Taxa de entrega</span>
                  <strong>{formatCurrency(pedido.taxaEntrega)}</strong>
                </div>
              )}
              <div className="summary-list__total">
                <span>Total</span>
                <strong>{formatCurrency(pedido.total)}</strong>
              </div>
            </div>

            <button
              className="button button--primary button--block"
              disabled={isProcessing}
              onClick={handleConfirm}
              type="button"
            >
              {isProcessing ? "Processando pagamento..." : `Pagar ${formatCurrency(pedido.total)}`}
            </button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
};

export default PagamentoPage;
