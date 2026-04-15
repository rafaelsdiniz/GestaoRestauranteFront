import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { listarIngredientes } from "../services/IngredienteService";
import {
  atualizarItemCardapio,
  criarItemCardapio,
  deletarItemCardapio,
  listarItensCardapio,
} from "../services/ItemCardapioService";
import { listarSugestoes } from "../services/SugestaoChefe";
import {
  criarAtendimentoPresencial,
  criarAtendimentoDeliveryProprio,
  criarAtendimentoDeliveryAplicativo,
} from "../services/AtendimentoService";
import { criarEndereco, listarEnderecosDoUsuario } from "../services/EnderecoService";
import { criarPedido } from "../services/PedidoService";
import type { Ingrediente } from "../types/Ingrediente";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { ItemCardapioRequestDTO } from "../types/dto/item-cardapio/ItemCardapioRequestDTO";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import type { Endereco } from "../types/Endereco";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";
import { Categoria } from "../types/enums/Categoria";
import { Periodo } from "../types/enums/Periodo";
import { TipoAgendamento } from "../types/enums/TipoAgendamento";
import { getErrorMessage } from "../utils/error";
import {
  formatAddress,
  formatCurrency,
  getPeriodoLabel,
  getTipoAtendimentoLabel,
  isSameDate,
  toDateInputValue,
} from "../utils/formatters";

interface CardapioPageProps {
  noShell?: boolean;
}

const emptyForm: ItemCardapioRequestDTO = {
  nome: "",
  descricao: "",
  precoBase: 0,
  periodo: Periodo.Almoco,
  categoria: Categoria.Prato,
  ingredientesIds: [],
  imagemBase64: "",
};

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
    text: "Consumo no local, sem taxa.",
  },
  {
    value: TipoAgendamento.DeliveryProprio,
    title: "Delivery proprio",
    text: "Taxa fixa de R$ 12.",
  },
  {
    value: TipoAgendamento.DeliveryAplicativo,
    title: "Delivery app",
    text: "Via iFood, Uber Eats...",
  },
];

const CardapioPage = ({ noShell }: CardapioPageProps = {}) => {
  const { isAuthenticated, usuario } = useAuth();
  const navigate = useNavigate();
  const usuarioId = usuario?.usuario?.id ?? usuario?.usuarioId;

  // --- Cardapio data ---
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Period by time ---
  const getHoraAtual = () => new Date().getHours();
  const getPeriodoAtual = (): Periodo | null => {
    const h = getHoraAtual();
    if (h >= 11 && h < 15) return Periodo.Almoco;
    if (h >= 18 && h < 22) return Periodo.Jantar;
    return null;
  };
  const periodoAtual = getPeriodoAtual();
  const foraDeHorario = periodoAtual === null;

  // --- Order state ---
  const [periodo, setPeriodo] = useState<Periodo>(periodoAtual ?? Periodo.Almoco);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAgendamento>(
    TipoAgendamento.AtendimentoPresencial
  );
  const [itensQtd, setItensQtd] = useState<Record<number, number>>({});
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(null);
  const [pagamentoPresencial, setPagamentoPresencial] = useState<"caixa" | "online">("caixa");
  const [nomeAplicativo, setNomeAplicativo] = useState("iFood");
  const [observacaoEntrega, setObservacaoEntrega] = useState("");
  const [novoEndereco, setNovoEndereco] = useState<EnderecoRequestDTO>(emptyAddress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  // --- Admin form state ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ItemCardapioRequestDTO>(emptyForm);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // --- Load cardapio data ---
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      const promises: Promise<unknown>[] = [
        listarItensCardapio(),
        listarSugestoes(),
      ];

      if (noShell) {
        promises.push(listarIngredientes());
      }

      const results = await Promise.allSettled(promises);

      if (!isMounted) return;

      if (results[0].status === "fulfilled") {
        setItens(results[0].value as ItemCardapio[]);
      } else {
        setError(
          getErrorMessage(
            (results[0] as PromiseRejectedResult).reason,
            "Nao foi possivel carregar o cardapio."
          )
        );
      }

      if (results[1].status === "fulfilled") {
        setSugestoes(results[1].value as SugestaoChefe[]);
      }

      if (results[2]?.status === "fulfilled") {
        setIngredientes(results[2].value as Ingrediente[]);
      }

      setIsLoading(false);
    };

    void loadData();
    return () => { isMounted = false; };
  }, [noShell]);

  // --- Load addresses when logged in and delivery selected ---
  const isDelivery = tipoAtendimento !== TipoAgendamento.AtendimentoPresencial;

  useEffect(() => {
    if (!isDelivery || !isAuthenticated || !usuarioId) return;
    let isMounted = true;
    listarEnderecosDoUsuario(usuarioId)
      .then((data) => {
        if (!isMounted) return;
        setEnderecos(data);
        setEnderecoSelecionadoId(data[0]?.id ?? null);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [isDelivery, isAuthenticated, usuarioId]);

  // --- Clear qty when period changes ---
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

  // --- Memos ---
  const itensDoPeriodo = useMemo(
    () => itens.filter((item) => item.periodo === periodo),
    [itens, periodo]
  );


  const itensAlmoco = useMemo(
    () => itens.filter((item) => item.periodo === Periodo.Almoco),
    [itens]
  );

  const itensJantar = useMemo(
    () => itens.filter((item) => item.periodo === Periodo.Jantar),
    [itens]
  );

  const sugestoesAtivas = useMemo(() => {
    const today = toDateInputValue(new Date());
    const sugestoesHoje = sugestoes.filter((s) => isSameDate(s.dataSugestao, today));

    const fallbackAlmoco = itensAlmoco.find((i) => i.ehSugestaoDoChefe);
    const fallbackJantar = itensJantar.find((i) => i.ehSugestaoDoChefe);

    return {
      almoco:
        sugestoesHoje.find((s) => s.periodo === Periodo.Almoco)?.nomeItem ??
        fallbackAlmoco?.nome ??
        "Selecione uma sugestao de almoco",
      jantar:
        sugestoesHoje.find((s) => s.periodo === Periodo.Jantar)?.nomeItem ??
        fallbackJantar?.nome ??
        "Selecione uma sugestao de jantar",
    };
  }, [itensAlmoco, itensJantar, sugestoes]);

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
    if (tipoAtendimento === TipoAgendamento.AtendimentoPresencial) return 0;
    if (tipoAtendimento === TipoAgendamento.DeliveryProprio) return 12;
    return subtotal * (periodo === Periodo.Almoco ? 0.04 : 0.06);
  }, [periodo, subtotal, tipoAtendimento]);

  const totalEstimado = subtotal - desconto + taxaEstimada;
  const hasItems = itensSelecionados.length > 0;

  // --- Order handlers ---
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

  const updateAddressField = <T extends keyof EnderecoRequestDTO>(
    field: T,
    value: EnderecoRequestDTO[T]
  ) => {
    setNovoEndereco((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    const required: Array<keyof EnderecoRequestDTO> = ["rua", "numero", "bairro", "cidade", "estado", "cep"];
    return required.every((f) => {
      const v = novoEndereco[f];
      return typeof v === "string" && v.trim().length > 0;
    });
  };

  const handleSaveAddress = async () => {
    if (!isAuthenticated || !usuarioId) return;
    setOrderError("");
    setOrderSuccess("");
    if (!validateAddress()) {
      setOrderError("Preencha todos os campos obrigatorios do novo endereco.");
      return;
    }
    setIsSavingAddress(true);
    try {
      const created = await criarEndereco(usuarioId, novoEndereco);
      setEnderecos((prev) => [...prev, created]);
      setEnderecoSelecionadoId(created.id);
      setNovoEndereco(emptyAddress);
      setOrderSuccess("Endereco salvo.");
    } catch (err) {
      setOrderError(getErrorMessage(err, "Nao foi possivel salvar o endereco."));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleOrder = async () => {
    setOrderError("");
    setOrderSuccess("");

    if (foraDeHorario) {
      setOrderError("Estamos fora do horario de funcionamento. Almoco: 11h as 15h | Jantar: 18h as 22h.");
      return;
    }

    if (periodo !== periodoAtual) {
      setOrderError(`Fora do horario de ${periodo === Periodo.Almoco ? "almoco (11h-15h)" : "jantar (18h-22h)"}.`);
      return;
    }

    if (!hasItems) {
      setOrderError("Selecione pelo menos um item.");
      return;
    }

    // Delivery requires login
    if (isDelivery && !isAuthenticated) {
      setOrderError("Faca login para pedidos de delivery.");
      return;
    }

    // Presencial without login - redirect to login with return
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const enderecoSelecionado = enderecos.find((e) => e.id === enderecoSelecionadoId);

    if (isDelivery && !enderecoSelecionado) {
      setOrderError("Selecione um endereco para delivery.");
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
          throw new Error("Tipo de atendimento invalido.");
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

      // Redirect based on service type and payment choice
      if (tipoAtendimento === TipoAgendamento.AtendimentoPresencial && pagamentoPresencial === "online") {
        navigate("/pedidos/pagamento", { state: { pedido: novoPedido, presencial: true } });
      } else if (tipoAtendimento === TipoAgendamento.DeliveryProprio) {
        navigate("/pedidos/pagamento", { state: { pedido: novoPedido } });
      } else if (tipoAtendimento === TipoAgendamento.DeliveryAplicativo) {
        navigate("/pedidos/confirmacao", { state: { pedido: novoPedido, viaApp: true, nomeAplicativo } });
      } else {
        navigate("/pedidos/confirmacao", { state: { pedido: novoPedido, pagarNoCaixa: true } });
      }
    } catch (err) {
      setOrderError(getErrorMessage(err, "Nao foi possivel concluir o pedido."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Admin helpers ──

  const handleEdit = (item: ItemCardapio) => {
    setEditingId(item.id);
    setFormData({
      nome: item.nome,
      descricao: item.descricao,
      precoBase: item.precoBase,
      periodo: item.periodo,
      categoria: item.categoria,
      ingredientesIds: [],
      imagemBase64: item.imagemBase64 ?? "",
    });
    setFormError("");
    setFormSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setFormSuccess("");
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError("Imagem deve ter no maximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imagemBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imagemBase64: "" }));
  };

  const toggleIngrediente = (id: number) => {
    setFormData((prev) => {
      const ids = prev.ingredientesIds ?? [];
      return {
        ...prev,
        ingredientesIds: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
      };
    });
  };

  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsAdminSubmitting(true);
    try {
      if (editingId) {
        const updated = await atualizarItemCardapio(editingId, formData);
        setItens((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        setFormSuccess("Item atualizado com sucesso.");
      } else {
        const created = await criarItemCardapio(formData);
        setItens((prev) => [...prev, created]);
        setFormSuccess("Item criado com sucesso.");
      }
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      setFormError(getErrorMessage(err, editingId ? "Erro ao atualizar item." : "Erro ao criar item."));
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      await deletarItemCardapio(id);
      setItens((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyForm);
      }
    } catch (err) {
      setFormError(getErrorMessage(err, "Erro ao excluir item."));
    }
  };

  // ── Render: Admin form ──
  const renderAdminForm = () => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">{editingId ? "Editar" : "Novo"} item</span>
          <h2>{editingId ? "Editar Item do Cardapio" : "Adicionar Item ao Cardapio"}</h2>
        </div>
      </div>

      <form className="form-grid form-grid--two" onSubmit={handleAdminSubmit}>
        <label className="field">
          <span>Nome</span>
          <input type="text" required placeholder="Nome do prato" value={formData.nome}
            onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))} />
        </label>
        <label className="field">
          <span>Preco base (R$)</span>
          <input type="number" required min={0} step={0.01} placeholder="0.00" value={formData.precoBase || ""}
            onChange={(e) => setFormData((p) => ({ ...p, precoBase: Number(e.target.value) }))} />
        </label>
        <label className="field field--full">
          <span>Descricao</span>
          <textarea required rows={3} placeholder="Descreva o prato" value={formData.descricao}
            onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))} />
        </label>
        <label className="field">
          <span>Periodo</span>
          <select value={formData.periodo}
            onChange={(e) => setFormData((p) => ({ ...p, periodo: Number(e.target.value) as Periodo }))}>
            <option value={Periodo.Almoco}>Almoco</option>
            <option value={Periodo.Jantar}>Jantar</option>
          </select>
        </label>
        <label className="field">
          <span>Categoria</span>
          <select value={formData.categoria}
            onChange={(e) => setFormData((p) => ({ ...p, categoria: Number(e.target.value) as Categoria }))}>
            <option value={Categoria.Prato}>Prato</option>
            <option value={Categoria.Bebida}>Bebida</option>
          </select>
        </label>
        <div className="field">
          <span>Ingredientes</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.25rem" }}>
            {ingredientes.map((ing) => {
              const selected = formData.ingredientesIds?.includes(ing.id);
              return (
                <button key={ing.id} type="button"
                  className={`pill ${selected ? "pill--highlight" : "pill--outline"}`}
                  onClick={() => toggleIngrediente(ing.id)} style={{ cursor: "pointer" }}>
                  {ing.nome}
                </button>
              );
            })}
            {ingredientes.length === 0 && (
              <span style={{ fontSize: "0.82rem", color: "var(--cream-muted)" }}>Nenhum ingrediente cadastrado.</span>
            )}
          </div>
        </div>
        <div className="image-upload">
          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--cream-muted)" }}>Foto do prato</span>
          {formData.imagemBase64 ? (
            <div className="image-upload__preview">
              <img src={formData.imagemBase64} alt="Preview" />
              <button className="image-upload__remove" onClick={handleRemoveImage} type="button">&times;</button>
            </div>
          ) : (
            <div className="image-upload__dropzone">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <div className="image-upload__icon">&#128247;</div>
              <p className="image-upload__label">
                <strong>Clique para enviar</strong> ou arraste a imagem<br />PNG, JPG ate 2MB
              </p>
            </div>
          )}
        </div>
        {formError && <div className="message message--error field--full">{formError}</div>}
        {formSuccess && <div className="message message--success field--full">{formSuccess}</div>}
        <div className="field--full" style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn--primary" disabled={isAdminSubmitting} type="submit">
            {isAdminSubmitting ? "Salvando..." : editingId ? "Salvar alteracoes" : "Adicionar item"}
          </button>
          {editingId && (
            <button className="btn btn--secondary" onClick={handleCancelEdit} type="button">Cancelar</button>
          )}
        </div>
      </form>
    </section>
  );

  // ── Render: Admin item grid (with edit/delete) ──
  const renderAdminItemGrid = (periodoLabel: string, menu: ItemCardapio[]) => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">{periodoLabel}</span>
          <h2>{periodoLabel}</h2>
        </div>
        <span className="pill">{menu.length} itens</span>
      </div>
      {menu.length === 0 ? (
        <div className="empty-state"><p>Nenhum item nesse periodo.</p></div>
      ) : (
        <div className="menu-grid">
          {menu.map((item) => {
            const precoFinal = item.ehSugestaoDoChefe ? item.precoBase * 0.8 : item.precoBase;
            return (
              <article className="menu-card" key={item.id}>
                {item.imagemBase64 ? (
                  <img className="menu-card__img" src={item.imagemBase64} alt={item.nome} />
                ) : (
                  <div className="menu-card__img-placeholder">Sem foto</div>
                )}
                <div className="menu-card__body">
                  <div className="menu-card__head">
                    <div>
                      <span className="pill pill--outline">{getPeriodoLabel(item.periodo)}</span>
                      {item.ehSugestaoDoChefe ? <span className="pill pill--highlight">Sugestao do Chefe</span> : null}
                    </div>
                    <strong>{formatCurrency(precoFinal)}</strong>
                  </div>
                  <h3>{item.nome}</h3>
                  <p>{item.descricao}</p>
                  <div className="tag-list">
                    {item.ingredientes?.length ? (
                      item.ingredientes.slice(0, 4).map((ing) => (
                        <span className="tag" key={`${item.id}-${ing}`}>{ing}</span>
                      ))
                    ) : (
                      <span className="tag">Sem ingredientes informados</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button className="btn btn--sm btn--secondary" onClick={() => handleEdit(item)} type="button">Editar</button>
                    <button className="btn btn--sm btn--ghost" onClick={() => handleDelete(item.id)} type="button">Excluir</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  // ── Render: Client item card (with qty controls) ──
  const renderClientItemCard = (item: ItemCardapio) => {
    const qty = itensQtd[item.id] || 0;
    const precoFinal = item.ehSugestaoDoChefe ? item.precoBase * 0.8 : item.precoBase;

    return (
      <article
        key={item.id}
        className={`menu-card menu-card--selectable${qty > 0 ? " is-selected" : ""}`}
      >
        {item.imagemBase64 ? (
          <img className="menu-card__img" src={item.imagemBase64} alt={item.nome} />
        ) : (
          <div className="menu-card__img-placeholder">Sem foto</div>
        )}

        <div className="menu-card__body">
          <div className="menu-card__head">
            <div>
              {item.ehSugestaoDoChefe ? (
                <span className="pill pill--highlight">20% off</span>
              ) : null}
            </div>
            <strong>{formatCurrency(precoFinal)}</strong>
          </div>

          <h3>{item.nome}</h3>
          <p>{item.descricao}</p>

          <div className="tag-list">
            {item.ingredientes?.length ? (
              item.ingredientes.slice(0, 4).map((ing) => (
                <span className="tag" key={`${item.id}-${ing}`}>{ing}</span>
              ))
            ) : null}
          </div>

          <div className="qty-control">
            <button className="qty-control__btn" disabled={qty === 0} onClick={() => removeItem(item.id)} type="button">-</button>
            <span className="qty-control__value">{qty}</span>
            <button className="qty-control__btn" onClick={() => addItem(item.id)} type="button">+</button>
          </div>
        </div>
      </article>
    );
  };

  // ── Render: Order sidebar ──
  const renderOrderSidebar = () => (
    <aside className="sidebar-stack">
      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Seu pedido</span>
            <h2>Resumo</h2>
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
          {desconto > 0 ? (
            <div>
              <span>Desconto</span>
              <strong>-{formatCurrency(desconto)}</strong>
            </div>
          ) : null}
          {taxaEstimada > 0 ? (
            <div>
              <span>Taxa</span>
              <strong>{formatCurrency(taxaEstimada)}</strong>
            </div>
          ) : null}
          <div className="summary-list__total">
            <span>Total estimado</span>
            <strong>{formatCurrency(totalEstimado)}</strong>
          </div>
        </div>

        <div className="tag-list">
          {itensSelecionadosDetalhes.length > 0 ? (
            itensSelecionadosDetalhes.map((item) => (
              <span className="tag" key={item.id}>{itensQtd[item.id]}x {item.nome}</span>
            ))
          ) : (
            <span className="tag">Nenhum item selecionado</span>
          )}
        </div>

        {/* Pagamento presencial */}
        {tipoAtendimento === TipoAgendamento.AtendimentoPresencial && (
          <div className="payment-choice">
            <span className="payment-choice__label">Forma de pagamento</span>
            <div className="payment-choice__options">
              <button
                type="button"
                className={`payment-choice__btn${pagamentoPresencial === "caixa" ? " is-active" : ""}`}
                onClick={() => setPagamentoPresencial("caixa")}
              >
                <strong>Pagar no caixa</strong>
                <span>Pague ao retirar o pedido</span>
              </button>
              <button
                type="button"
                className={`payment-choice__btn${pagamentoPresencial === "online" ? " is-active" : ""}`}
                onClick={() => setPagamentoPresencial("online")}
              >
                <strong>Pagar agora</strong>
                <span>Pagamento online antecipado</span>
              </button>
            </div>
          </div>
        )}

        {orderError ? <div className="message message--error">{orderError}</div> : null}
        {orderSuccess ? <div className="message message--success">{orderSuccess}</div> : null}

        <button
          className="button button--primary button--block"
          disabled={isSubmitting || !hasItems}
          onClick={handleOrder}
          type="button"
        >
          {isSubmitting
            ? "Finalizando..."
            : !isAuthenticated && tipoAtendimento === TipoAgendamento.AtendimentoPresencial
              ? "Entrar e finalizar pedido"
              : "Finalizar pedido"}
        </button>
      </section>

      {/* Delivery: address + extras */}
      {isDelivery && isAuthenticated ? (
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Entrega</span>
              <h2>Endereco e detalhes</h2>
            </div>
          </div>

          {tipoAtendimento === TipoAgendamento.DeliveryAplicativo ? (
            <label className="field">
              <span>Aplicativo parceiro</span>
              <input type="text" value={nomeAplicativo} onChange={(e) => setNomeAplicativo(e.target.value)} placeholder="iFood, AppX..." />
            </label>
          ) : null}

          <label className="field">
            <span>Observacoes de entrega</span>
            <textarea rows={2} value={observacaoEntrega} onChange={(e) => setObservacaoEntrega(e.target.value)}
              placeholder="Referencia, portaria..." />
          </label>

          <div className="address-grid">
            {enderecos.length > 0 ? (
              enderecos.map((endereco) => (
                <button
                  key={endereco.id}
                  className={`address-card${enderecoSelecionadoId === endereco.id ? " is-active" : ""}`}
                  onClick={() => setEnderecoSelecionadoId(endereco.id)}
                  type="button"
                >
                  <strong>{formatAddress(endereco)}</strong>
                  <span>CEP {endereco.cep}</span>
                </button>
              ))
            ) : (
              <div className="empty-state"><p>Cadastre um endereco abaixo.</p></div>
            )}
          </div>

          <div className="form-grid form-grid--two">
            <label className="field">
              <span>Rua</span>
              <input type="text" value={novoEndereco.rua} onChange={(e) => updateAddressField("rua", e.target.value)} placeholder="Rua das Flores" />
            </label>
            <label className="field">
              <span>Numero</span>
              <input type="text" value={novoEndereco.numero} onChange={(e) => updateAddressField("numero", e.target.value)} placeholder="45" />
            </label>
            <label className="field">
              <span>Complemento</span>
              <input type="text" value={novoEndereco.complemento ?? ""} onChange={(e) => updateAddressField("complemento", e.target.value)} placeholder="Apto..." />
            </label>
            <label className="field">
              <span>Bairro</span>
              <input type="text" value={novoEndereco.bairro} onChange={(e) => updateAddressField("bairro", e.target.value)} placeholder="Centro" />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input type="text" value={novoEndereco.cidade} onChange={(e) => updateAddressField("cidade", e.target.value)} placeholder="Campinas" />
            </label>
            <label className="field">
              <span>Estado</span>
              <input type="text" value={novoEndereco.estado} maxLength={2} onChange={(e) => updateAddressField("estado", e.target.value.toUpperCase())} placeholder="SP" />
            </label>
            <label className="field field--full">
              <span>CEP</span>
              <input type="text" value={novoEndereco.cep} onChange={(e) => updateAddressField("cep", e.target.value)} placeholder="00000-000" />
            </label>
          </div>

          <button className="button button--secondary button--block" disabled={isSavingAddress} onClick={handleSaveAddress} type="button">
            {isSavingAddress ? "Salvando..." : "Salvar endereco"}
          </button>
        </section>
      ) : isDelivery && !isAuthenticated ? (
        <section className="panel panel--section">
          <div className="empty-state">
            <p>Faca login para pedidos de delivery.</p>
            <button className="button button--primary" onClick={() => navigate("/login")} type="button">Entrar</button>
          </div>
        </section>
      ) : null}
    </aside>
  );

  // ── Admin page ──
  if (noShell) {
    return (
      <div className="page">
        <section className="hero hero--compact">
          <div className="hero__content">
            <span className="kicker">Gestao</span>
            <h1>Itens do Cardapio</h1>
            <p className="hero__lead">Adicione, edite e remova pratos. Envie fotos para cada item.</p>
          </div>
        </section>

        {renderAdminForm()}

        {error ? <div className="message message--error">{error}</div> : null}
        {isLoading ? (
          <div className="loading-state panel">
            <span className="route-status__spinner" />
            <p>Carregando o cardapio...</p>
          </div>
        ) : (
          <section className="section-stack">
            {renderAdminItemGrid("Almoco", itensAlmoco)}
            {renderAdminItemGrid("Jantar", itensJantar)}
          </section>
        )}
      </div>
    );
  }

  // ── Client page (unified cardapio + pedido) ──
  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Cardapio</span>
          <h1>Nosso cardapio</h1>
          <p className="hero__lead">
            Explore os pratos, adicione ao pedido e finalize. Sugestao do chefe com 20% de desconto.
          </p>
        </div>
      </section>

      {/* Sugestao do chefe */}
      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Sugestao do Chefe</span>
            <h2>Destaques do dia - 20% off</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <article style={{ padding: "1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "rgba(176, 140, 62, 0.04)" }}>
            <span className="pill pill--highlight" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Almoco</span>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{sugestoesAtivas.almoco}</strong>
          </article>
          <article style={{ padding: "1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "rgba(139, 38, 53, 0.04)" }}>
            <span className="pill pill--highlight" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Jantar</span>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{sugestoesAtivas.jantar}</strong>
          </article>
        </div>
      </section>

      {/* Period + service type controls */}
      <div className="segmented">
        {[Periodo.Almoco, Periodo.Jantar].map((value) => (
          <button
            key={value}
            className={`segmented__button${periodo === value ? " is-active" : ""}`}
            onClick={() => setPeriodo(value)}
            type="button"
          >
            {getPeriodoLabel(value)}
          </button>
        ))}
      </div>

      <div className="option-grid">
        {serviceTypes.map((s) => (
          <button
            key={s.value}
            className={`option-card${tipoAtendimento === s.value ? " is-active" : ""}`}
            onClick={() => setTipoAtendimento(s.value)}
            type="button"
          >
            <strong>{s.title}</strong>
            <p>{s.text}</p>
          </button>
        ))}
      </div>

      {/* Aviso de horario */}
      {foraDeHorario && (
        <div className="message message--warning">
          Estamos fora do horario de funcionamento. Almoco: 11h as 15h | Jantar: 18h as 22h. Voce pode consultar o cardapio, mas pedidos estao indisponiveis.
        </div>
      )}
      {!foraDeHorario && periodo !== periodoAtual && (
        <div className="message message--warning">
          O cardapio de {periodo === Periodo.Almoco ? "almoco" : "jantar"} esta fora do horario. Pedidos disponiveis apenas para {periodoAtual === Periodo.Almoco ? "almoco (11h-15h)" : "jantar (18h-22h)"}.
        </div>
      )}

      {/* Menu grid + sidebar */}
      {error ? <div className="message message--error">{error}</div> : null}

      {isLoading ? (
        <div className="loading-state panel">
          <span className="route-status__spinner" />
          <p>Carregando cardapio...</p>
        </div>
      ) : (
        <div className="section-grid section-grid--order">
          <div className="menu-grid">
            {itensDoPeriodo.length === 0 ? (
              <div className="empty-state"><p>Nenhum prato nesse periodo.</p></div>
            ) : (
              itensDoPeriodo.map(renderClientItemCard)
            )}
          </div>

          {renderOrderSidebar()}
        </div>
      )}
    </AppShell>
  );
};

export default CardapioPage;
