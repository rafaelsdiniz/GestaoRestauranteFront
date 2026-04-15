import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  criarAtendimentoPresencial,
  criarAtendimentoDeliveryProprio,
  criarAtendimentoDeliveryAplicativo,
} from "../services/AtendimentoService";
import { criarEndereco, listarEnderecosDoUsuario } from "../services/EnderecoService";
import { listarItensCardapio } from "../services/ItemCardapioService";
import { criarPedido } from "../services/PedidoService";
import type { Endereco } from "../types/Endereco";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";
import { Periodo } from "../types/enums/Periodo";
import { TipoAgendamento } from "../types/enums/TipoAgendamento";
import { getErrorMessage } from "../utils/error";
import {
  formatAddress,
  formatCurrency,
  getPeriodoLabel,
  getTipoAtendimentoLabel,
} from "../utils/formatters";

const emptyAddress: EnderecoRequestDTO = {
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

const serviceTypes = [
  {
    value: TipoAgendamento.AtendimentoPresencial,
    title: "Presencial",
    text: "Ideal para consumo local e atendimento imediato.",
  },
  {
    value: TipoAgendamento.DeliveryProprio,
    title: "Delivery proprio",
    text: "Usa seus enderecos salvos e taxa fixa do restaurante.",
  },
  {
    value: TipoAgendamento.DeliveryAplicativo,
    title: "Delivery por aplicativo",
    text: "Permite informar o parceiro e repassar observacoes de entrega.",
  },
];

const PedidoPage = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>(Periodo.Almoco);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAgendamento>(
    TipoAgendamento.AtendimentoPresencial
  );
  const [itensQtd, setItensQtd] = useState<Record<number, number>>({});
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(
    null
  );
  const [nomeAplicativo, setNomeAplicativo] = useState("iFood");
  const [observacaoEntrega, setObservacaoEntrega] = useState("");
  const [novoEndereco, setNovoEndereco] = useState<EnderecoRequestDTO>(emptyAddress);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setItensQtd((prev) => {
      const filtered: Record<number, number> = {};
      for (const [id, qty] of Object.entries(prev)) {
        const numId = Number(id);
        if (itens.some((item) => item.id === numId && item.periodo === periodo)) {
          filtered[numId] = qty;
        }
      }
      return filtered;
    });
  }, [itens, periodo]);

  const usuarioId = usuario?.usuario?.id ?? usuario?.usuarioId;

  useEffect(() => {
    if (!usuarioId) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      const [itensResult, enderecosResult] = await Promise.allSettled([
        listarItensCardapio(),
        listarEnderecosDoUsuario(usuarioId),
      ]);

      if (!isMounted) {
        return;
      }

      if (itensResult.status === "fulfilled") {
        setItens(itensResult.value);
      } else {
        setError(
          getErrorMessage(
            itensResult.reason,
            "Nao foi possivel carregar o cardapio para montar o pedido."
          )
        );
      }

      if (enderecosResult.status === "fulfilled") {
        setEnderecos(enderecosResult.value);
        setEnderecoSelecionadoId(enderecosResult.value[0]?.id ?? null);
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [usuarioId]);

  const itensDoPeriodo = useMemo(
    () => itens.filter((item) => item.periodo === periodo),
    [itens, periodo]
  );

  const itensSelecionados = useMemo(
    () => Object.keys(itensQtd).map(Number).filter((id) => itensQtd[id] > 0),
    [itensQtd]
  );

  const itensSelecionadosDetalhes = useMemo(
    () => itens.filter((item) => itensSelecionados.includes(item.id)),
    [itens, itensSelecionados]
  );

  const subtotal = useMemo(
    () =>
      itensSelecionadosDetalhes.reduce(
        (total, item) => total + item.precoBase * (itensQtd[item.id] || 0),
        0
      ),
    [itensSelecionadosDetalhes, itensQtd]
  );

  const desconto = useMemo(
    () =>
      itensSelecionadosDetalhes.reduce(
        (total, item) =>
          total + (item.ehSugestaoDoChefe ? item.precoBase * 0.2 * (itensQtd[item.id] || 0) : 0),
        0
      ),
    [itensSelecionadosDetalhes, itensQtd]
  );

  const taxaEstimada = useMemo(() => {
    if (tipoAtendimento === TipoAgendamento.AtendimentoPresencial) {
      return 0;
    }

    if (tipoAtendimento === TipoAgendamento.DeliveryProprio) {
      return 12;
    }

    return subtotal * (periodo === Periodo.Almoco ? 0.04 : 0.06);
  }, [periodo, subtotal, tipoAtendimento]);

  const totalEstimado = subtotal - desconto + taxaEstimada;

  const updateAddressField = <T extends keyof EnderecoRequestDTO>(
    field: T,
    value: EnderecoRequestDTO[T]
  ) => {
    setNovoEndereco((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addItem = (itemId: number) => {
    setItensQtd((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeItem = (itemId: number) => {
    setItensQtd((prev) => {
      const qty = (prev[itemId] || 0) - 1;
      if (qty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: qty };
    });
  };

  const validateAddress = () => {
    const requiredFields: Array<keyof EnderecoRequestDTO> = [
      "rua",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "cep",
    ];

    return requiredFields.every((field) => {
      const fieldValue = novoEndereco[field];
      return typeof fieldValue === "string" && fieldValue.trim().length > 0;
    });
  };

  const handleSaveAddress = async () => {
    if (!usuario) {
      return;
    }

    setError("");
    setSuccess("");

    if (!validateAddress()) {
      setError("Preencha todos os campos obrigatorios do novo endereco.");
      return;
    }

    setIsSavingAddress(true);

    try {
      const createdAddress = await criarEndereco(usuarioId!, novoEndereco);

      setEnderecos((previous) => [...previous, createdAddress]);
      setEnderecoSelecionadoId(createdAddress.id);
      setNovoEndereco(emptyAddress);
      setSuccess("Endereco salvo e pronto para ser usado no delivery.");
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Nao foi possivel salvar o endereco de entrega."
        )
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (!usuario) {
      return;
    }

    setError("");
    setSuccess("");

    if (itensSelecionados.length === 0) {
      setError("Selecione pelo menos um item para fechar o pedido.");
      return;
    }

    const enderecoSelecionado = enderecos.find(
      (endereco) => endereco.id === enderecoSelecionadoId
    );

    if (
      tipoAtendimento !== TipoAgendamento.AtendimentoPresencial &&
      !enderecoSelecionado
    ) {
      setError("Selecione um endereco para pedidos de delivery.");
      return;
    }

    setIsSubmitting(true);

    try {
      const observacao = enderecoSelecionado
        ? `Entregar em ${formatAddress(enderecoSelecionado)}. ${observacaoEntrega}`.trim()
        : observacaoEntrega || undefined;

      let atendimento;
      switch (tipoAtendimento) {
        case TipoAgendamento.AtendimentoPresencial:
          atendimento = await criarAtendimentoPresencial(observacao);
          break;
        case TipoAgendamento.DeliveryProprio:
          atendimento = await criarAtendimentoDeliveryProprio(observacao);
          break;
        case TipoAgendamento.DeliveryAplicativo:
          atendimento = await criarAtendimentoDeliveryAplicativo(nomeAplicativo, observacao);
          break;
        default:
          throw new Error("Tipo de atendimento inválido.");
      }

      const itensIds: number[] = [];
      for (const [id, qty] of Object.entries(itensQtd)) {
        for (let i = 0; i < qty; i++) itensIds.push(Number(id));
      }

      const novoPedido = await criarPedido(usuarioId!, {
        atendimentoId: atendimento.id,
        itensIds,
        periodo,
      });

      navigate("/pedidos/confirmacao", { state: { pedido: novoPedido } });
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Nao foi possivel concluir o pedido. Verifique os dados enviados."
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
          <span className="kicker">Pedidos</span>
          <h1>Monte seu pedido</h1>
          <p className="hero__lead">
            Escolha o periodo, tipo de atendimento e selecione os itens do
            cardapio. O resumo financeiro atualiza em tempo real.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--order">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Montagem do pedido</span>
              <h2>Escolha periodo, atendimento e itens</h2>
            </div>
          </div>

          <div className="segmented">
            {[Periodo.Almoco, Periodo.Jantar].map((value) => (
              <button
                key={value}
                className={`segmented__button${
                  periodo === value ? " is-active" : ""
                }`}
                onClick={() => setPeriodo(value)}
                type="button"
              >
                {getPeriodoLabel(value)}
              </button>
            ))}
          </div>

          <div className="option-grid">
            {serviceTypes.map((service) => (
              <button
                key={service.value}
                className={`option-card${
                  tipoAtendimento === service.value ? " is-active" : ""
                }`}
                onClick={() => setTipoAtendimento(service.value)}
                type="button"
              >
                <strong>{service.title}</strong>
                <p>{service.text}</p>
              </button>
            ))}
          </div>

          {tipoAtendimento !== TipoAgendamento.AtendimentoPresencial ? (
            <div className="form-grid form-grid--two">
              {tipoAtendimento === TipoAgendamento.DeliveryAplicativo ? (
                <label className="field field--full">
                  <span>Aplicativo parceiro</span>
                  <input
                    onChange={(event) => setNomeAplicativo(event.target.value)}
                    placeholder="iFood, AppX..."
                    type="text"
                    value={nomeAplicativo}
                  />
                </label>
              ) : null}

              <label className="field field--full">
                <span>Observacoes de entrega</span>
                <textarea
                  onChange={(event) => setObservacaoEntrega(event.target.value)}
                  placeholder="Ponto de referencia, portaria, nome de quem recebe..."
                  rows={3}
                  value={observacaoEntrega}
                />
              </label>
            </div>
          ) : null}

          {isLoading ? (
            <div className="loading-state">
              <span className="route-status__spinner" />
              <p>Carregando itens do cardapio...</p>
            </div>
          ) : (
            <div className="menu-grid">
              {itensDoPeriodo.map((item) => {
                const qty = itensQtd[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`menu-card menu-card--selectable${qty > 0 ? " is-selected" : ""}`}
                  >
                    <div className="menu-card__head">
                      <span className="pill pill--outline">
                        {getPeriodoLabel(item.periodo)}
                      </span>

                      {item.ehSugestaoDoChefe ? (
                        <span className="pill pill--highlight">20% off</span>
                      ) : null}
                    </div>

                    <h3>{item.nome}</h3>
                    <p>{item.descricao}</p>
                    <strong>{formatCurrency(item.precoBase)}</strong>

                    <div className="qty-control">
                      <button
                        className="qty-control__btn"
                        disabled={qty === 0}
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        -
                      </button>
                      <span className="qty-control__value">{qty}</span>
                      <button
                        className="qty-control__btn"
                        onClick={() => addItem(item.id)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="sidebar-stack">
          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Resumo do pedido</span>
                <h2>Fechamento visual</h2>
              </div>
            </div>

            <div className="summary-list">
              <div>
                <span>Periodo</span>
                <strong>{getPeriodoLabel(periodo)}</strong>
              </div>
              <div>
                <span>Atendimento</span>
                <strong>{getTipoAtendimentoLabel(tipoAtendimento)}</strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                <span>Desconto previsto</span>
                <strong>{formatCurrency(desconto)}</strong>
              </div>
              <div>
                <span>Taxa estimada</span>
                <strong>{formatCurrency(taxaEstimada)}</strong>
              </div>
              <div className="summary-list__total">
                <span>Total estimado</span>
                <strong>{formatCurrency(totalEstimado)}</strong>
              </div>
            </div>

            <div className="tag-list">
              {itensSelecionadosDetalhes.length > 0 ? (
                itensSelecionadosDetalhes.map((item) => (
                  <span className="tag" key={item.id}>
                    {itensQtd[item.id]}x {item.nome}
                  </span>
                ))
              ) : (
                <span className="tag">Nenhum item selecionado</span>
              )}
            </div>

            <button
              className="button button--primary button--block"
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Finalizando pedido..." : "Finalizar pedido"}
            </button>
          </section>

          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Enderecos</span>
                <h2>Gestao de entrega</h2>
              </div>
            </div>

            {tipoAtendimento !== TipoAgendamento.AtendimentoPresencial ? (
              <div className="address-grid">
                {enderecos.length > 0 ? (
                  enderecos.map((endereco) => (
                    <button
                      key={endereco.id}
                      className={`address-card${
                        enderecoSelecionadoId === endereco.id ? " is-active" : ""
                      }`}
                      onClick={() => setEnderecoSelecionadoId(endereco.id)}
                      type="button"
                    >
                      <strong>{formatAddress(endereco)}</strong>
                      <span>CEP {endereco.cep}</span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>Cadastre um endereco para habilitar o delivery.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>Pedidos presenciais nao precisam de endereco cadastrado.</p>
              </div>
            )}

            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Rua</span>
                <input
                  onChange={(event) => updateAddressField("rua", event.target.value)}
                  placeholder="Rua das Flores"
                  type="text"
                  value={novoEndereco.rua}
                />
              </label>

              <label className="field">
                <span>Numero</span>
                <input
                  onChange={(event) => updateAddressField("numero", event.target.value)}
                  placeholder="45"
                  type="text"
                  value={novoEndereco.numero}
                />
              </label>

              <label className="field">
                <span>Complemento</span>
                <input
                  onChange={(event) =>
                    updateAddressField("complemento", event.target.value)
                  }
                  placeholder="Casa, apto..."
                  type="text"
                  value={novoEndereco.complemento ?? ""}
                />
              </label>

              <label className="field">
                <span>Bairro</span>
                <input
                  onChange={(event) => updateAddressField("bairro", event.target.value)}
                  placeholder="Centro"
                  type="text"
                  value={novoEndereco.bairro}
                />
              </label>

              <label className="field">
                <span>Cidade</span>
                <input
                  onChange={(event) => updateAddressField("cidade", event.target.value)}
                  placeholder="Campinas"
                  type="text"
                  value={novoEndereco.cidade}
                />
              </label>

              <label className="field">
                <span>Estado</span>
                <input
                  maxLength={2}
                  onChange={(event) =>
                    updateAddressField("estado", event.target.value.toUpperCase())
                  }
                  placeholder="SP"
                  type="text"
                  value={novoEndereco.estado}
                />
              </label>

              <label className="field field--full">
                <span>CEP</span>
                <input
                  onChange={(event) => updateAddressField("cep", event.target.value)}
                  placeholder="00000-000"
                  type="text"
                  value={novoEndereco.cep}
                />
              </label>
            </div>

            <button
              className="button button--secondary button--block"
              disabled={isSavingAddress}
              onClick={handleSaveAddress}
              type="button"
            >
              {isSavingAddress ? "Salvando endereco..." : "Salvar novo endereco"}
            </button>
          </section>
        </aside>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}
    </AppShell>
  );
};

export default PedidoPage;
