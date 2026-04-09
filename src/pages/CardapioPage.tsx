import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  listarIngredientes,
} from "../services/IngredienteService";
import {
  atualizarItemCardapio,
  criarItemCardapio,
  deletarItemCardapio,
  listarItensCardapio,
} from "../services/ItemCardapioService";
import { listarSugestoes } from "../services/SugestaoChefe";
import type { Ingrediente } from "../types/Ingrediente";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { ItemCardapioRequestDTO } from "../types/dto/item-cardapio/ItemCardapioRequestDTO";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import { Periodo } from "../types/enums/Periodo";
import { getErrorMessage } from "../utils/error";
import {
  formatCurrency,
  getPeriodoLabel,
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
  ingredientesIds: [],
  imagemBase64: "",
};

const CardapioPage = ({ noShell }: CardapioPageProps = {}) => {
  const { isAuthenticated } = useAuth();
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Admin form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ItemCardapioRequestDTO>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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
    const sugestoesHoje = sugestoes.filter((sugestao) =>
      isSameDate(sugestao.dataSugestao, today)
    );

    const fallbackAlmoco = itensAlmoco.find((item) => item.ehSugestaoDoChefe);
    const fallbackJantar = itensJantar.find((item) => item.ehSugestaoDoChefe);

    return {
      almoco:
        sugestoesHoje.find((sugestao) => sugestao.periodo === Periodo.Almoco)
          ?.nomeItem ?? fallbackAlmoco?.nome ?? "Selecione uma sugestao de almoco",
      jantar:
        sugestoesHoje.find((sugestao) => sugestao.periodo === Periodo.Jantar)
          ?.nomeItem ?? fallbackJantar?.nome ?? "Selecione uma sugestao de jantar",
    };
  }, [itensAlmoco, itensJantar, sugestoes]);

  const dashboardStats = useMemo(
    () => [
      { value: `${itens.length}`, label: "itens conectados ao backend" },
      { value: "20%", label: "desconto da sugestao do chefe" },
      { value: "3", label: "modos de atendimento da operacao" },
      { value: "19h-22h", label: "janela sugerida para reservas" },
    ],
    [itens.length]
  );

  // ── Admin helpers ──

  const handleEdit = (item: ItemCardapio) => {
    setEditingId(item.id);
    setFormData({
      nome: item.nome,
      descricao: item.descricao,
      precoBase: item.precoBase,
      periodo: item.periodo,
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
        ingredientesIds: ids.includes(id)
          ? ids.filter((i) => i !== id)
          : [...ids, id],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

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
      setFormError(
        getErrorMessage(err, editingId ? "Erro ao atualizar item." : "Erro ao criar item.")
      );
    } finally {
      setIsSubmitting(false);
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

  // ── Render helpers ──

  const renderItemGrid = (periodoLabel: string, menu: ItemCardapio[]) => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">{periodoLabel}</span>
          <h2>{periodoLabel}</h2>
        </div>
        <span className="pill">{menu.length} itens</span>
      </div>

      {menu.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum item carregado nesse periodo ainda.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {menu.map((item) => {
            const precoFinal = item.ehSugestaoDoChefe
              ? item.precoBase * 0.8
              : item.precoBase;

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
                      <span className="pill pill--outline">
                        {getPeriodoLabel(item.periodo)}
                      </span>
                      {item.ehSugestaoDoChefe ? (
                        <span className="pill pill--highlight">Sugestao do Chefe</span>
                      ) : null}
                    </div>
                    <strong>{formatCurrency(precoFinal)}</strong>
                  </div>

                  <h3>{item.nome}</h3>
                  <p>{item.descricao}</p>

                  <div className="tag-list">
                    {item.ingredientes?.length ? (
                      item.ingredientes.slice(0, 4).map((ingrediente) => (
                        <span className="tag" key={`${item.id}-${ingrediente}`}>
                          {ingrediente}
                        </span>
                      ))
                    ) : (
                      <span className="tag">Sem ingredientes informados</span>
                    )}
                  </div>

                  {noShell && (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button className="btn btn--sm btn--secondary" onClick={() => handleEdit(item)} type="button">
                        Editar
                      </button>
                      <button className="btn btn--sm btn--ghost" onClick={() => handleDelete(item.id)} type="button">
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderAdminForm = () => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">{editingId ? "Editar" : "Novo"} item</span>
          <h2>{editingId ? "Editar Item do Cardapio" : "Adicionar Item ao Cardapio"}</h2>
        </div>
      </div>

      <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            required
            placeholder="Nome do prato"
            value={formData.nome}
            onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
          />
        </label>

        <label className="field">
          <span>Preco base (R$)</span>
          <input
            type="number"
            required
            min={0}
            step={0.01}
            placeholder="0.00"
            value={formData.precoBase || ""}
            onChange={(e) => setFormData((p) => ({ ...p, precoBase: Number(e.target.value) }))}
          />
        </label>

        <label className="field field--full">
          <span>Descricao</span>
          <textarea
            required
            rows={3}
            placeholder="Descreva o prato"
            value={formData.descricao}
            onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
          />
        </label>

        <label className="field">
          <span>Periodo</span>
          <select
            value={formData.periodo}
            onChange={(e) => setFormData((p) => ({ ...p, periodo: Number(e.target.value) as Periodo }))}
          >
            <option value={Periodo.Almoco}>Almoco</option>
            <option value={Periodo.Jantar}>Jantar</option>
          </select>
        </label>

        <div className="field">
          <span>Ingredientes</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.25rem" }}>
            {ingredientes.map((ing) => {
              const selected = formData.ingredientesIds?.includes(ing.id);
              return (
                <button
                  key={ing.id}
                  type="button"
                  className={`pill ${selected ? "pill--highlight" : "pill--outline"}`}
                  onClick={() => toggleIngrediente(ing.id)}
                  style={{ cursor: "pointer" }}
                >
                  {ing.nome}
                </button>
              );
            })}
            {ingredientes.length === 0 && (
              <span style={{ fontSize: "0.82rem", color: "var(--cream-muted)" }}>
                Nenhum ingrediente cadastrado.
              </span>
            )}
          </div>
        </div>

        <div className="image-upload">
          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--cream-muted)" }}>
            Foto do prato
          </span>
          {formData.imagemBase64 ? (
            <div className="image-upload__preview">
              <img src={formData.imagemBase64} alt="Preview" />
              <button className="image-upload__remove" onClick={handleRemoveImage} type="button">
                &times;
              </button>
            </div>
          ) : (
            <div className="image-upload__dropzone">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <div className="image-upload__icon">&#128247;</div>
              <p className="image-upload__label">
                <strong>Clique para enviar</strong> ou arraste a imagem<br />
                PNG, JPG ate 2MB
              </p>
            </div>
          )}
        </div>

        {formError && <div className="message message--error field--full">{formError}</div>}
        {formSuccess && <div className="message message--success field--full">{formSuccess}</div>}

        <div className="field--full" style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn--primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Salvando..."
              : editingId
                ? "Salvar alteracoes"
                : "Adicionar item"}
          </button>
          {editingId && (
            <button className="btn btn--secondary" onClick={handleCancelEdit} type="button">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );

  // ── Client-facing content ──

  const clientContent = (
    <>
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Cardapio</span>
          <h1>Nosso cardapio completo</h1>
          <p className="hero__lead">
            Pratos divididos por periodo com ingredientes detalhados e
            destaque para a sugestao do chefe com 20% de desconto.
          </p>

          <div className="hero__actions">
            <Link
              className="btn btn--primary"
              to={isAuthenticated ? "/pedidos" : "/cadastro"}
            >
              {isAuthenticated ? "Montar pedido" : "Criar conta para pedir"}
            </Link>
          </div>
        </div>
      </section>

      <section className="panel panel--section" style={{ marginBottom: "2rem" }}>
        <div className="panel__header">
          <div>
            <span className="kicker">Sugestao do Chefe</span>
            <h2>Destaques do dia com 20% de desconto</h2>
          </div>
          <span className="pill">{dashboardStats[0].value} itens</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <article style={{ padding: "1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "rgba(176, 140, 62, 0.04)" }}>
            <span className="pill pill--highlight" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Almoco</span>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{sugestoesAtivas.almoco}</strong>
            <p style={{ fontSize: "0.85rem", color: "var(--cream-muted)", marginTop: "0.25rem" }}>Desconto automatico de 20% aplicado no pedido.</p>
          </article>
          <article style={{ padding: "1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "rgba(139, 38, 53, 0.04)" }}>
            <span className="pill pill--highlight" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Jantar</span>
            <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{sugestoesAtivas.jantar}</strong>
            <p style={{ fontSize: "0.85rem", color: "var(--cream-muted)", marginTop: "0.25rem" }}>Destaque do chefe para a noite com preco especial.</p>
          </article>
        </div>
      </section>
    </>
  );

  // ── Admin content ──

  const adminContent = (
    <>
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Gestao</span>
          <h1>Itens do Cardapio</h1>
          <p className="hero__lead">
            Adicione, edite e remova pratos. Envie fotos para cada item.
          </p>
        </div>
      </section>

      {renderAdminForm()}
    </>
  );

  // ── Shared content (item grids) ──

  const itemGrids = (
    <>
      {error ? <div className="message message--error">{error}</div> : null}

      {isLoading ? (
        <div className="loading-state panel">
          <span className="route-status__spinner" />
          <p>Carregando o cardapio...</p>
        </div>
      ) : (
        <section className="section-stack">
          {renderItemGrid("Almoco", itensAlmoco)}
          {renderItemGrid("Jantar", itensJantar)}
        </section>
      )}
    </>
  );

  if (noShell) {
    return (
      <div className="page">
        {adminContent}
        {itemGrids}
      </div>
    );
  }

  return (
    <AppShell contentClassName="page">
      {clientContent}
      {itemGrids}
    </AppShell>
  );
};

export default CardapioPage;
