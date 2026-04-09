import { useEffect, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  listarIngredientes,
  criarIngrediente,
  atualizarIngrediente,
  deletarIngrediente,
} from "../services/IngredienteService";
import type { Ingrediente } from "../types/Ingrediente";
import type { IngredienteRequestDTO } from "../types/dto/ingrediente/IngredienteRequestDTO";
import { getErrorMessage } from "../utils/error";

const emptyIngredient: IngredienteRequestDTO = {
  nome: "",
  descricao: "",
};

interface IngredientePageProps {
  noShell?: boolean;
}

const IngredientePage = ({ noShell }: IngredientePageProps = {}) => {
  const { isAdmin } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<IngredienteRequestDTO>(emptyIngredient);

  useEffect(() => {
    let isMounted = true;

    const loadIngredients = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await listarIngredientes();
        if (isMounted) {
          setIngredientes(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            getErrorMessage(
              error,
              "Não foi possível carregar os ingredientes."
            )
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadIngredients();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = <T extends keyof IngredienteRequestDTO>(
    field: T,
    value: IngredienteRequestDTO[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (ingrediente: Ingrediente) => {
    setEditingId(ingrediente.id);
    setFormData({
      nome: ingrediente.nome,
      descricao: ingrediente.descricao || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyIngredient);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isAdmin) {
      setError("Apenas administradores podem gerenciar ingredientes.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await atualizarIngrediente(editingId, formData);
        setIngredientes((prev) =>
          prev.map((ing) =>
            ing.id === editingId ? { ...ing, ...formData } : ing
          )
        );
        setSuccess("Ingrediente atualizado com sucesso.");
      } else {
        const novoIngrediente = await criarIngrediente(formData);
        setIngredientes((prev) => [...prev, novoIngrediente]);
        setSuccess("Ingrediente criado com sucesso.");
      }

      setEditingId(null);
      setFormData(emptyIngredient);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          editingId
            ? "Não foi possível atualizar o ingrediente."
            : "Não foi possível criar o ingrediente."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este ingrediente?")) {
      return;
    }

    if (!isAdmin) {
      setError("Apenas administradores podem excluir ingredientes.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deletarIngrediente(id);
      setIngredientes((prev) => prev.filter((ing) => ing.id !== id));
      setSuccess("Ingrediente excluído com sucesso.");

      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyIngredient);
      }
    } catch (error) {
      setError(
        getErrorMessage(error, "Não foi possível excluir o ingrediente.")
      );
    }
  };

  const content = (
    <>
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Ingredientes</span>
          <h1>Gerenciamento de Ingredientes</h1>
          <p className="hero__lead">
            Gerencie os ingredientes disponíveis para os itens do cardápio.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">
                {editingId ? "Editar" : "Novo"} ingrediente
              </span>
              <h2>{editingId ? "Editar Ingrediente" : "Adicionar Ingrediente"}</h2>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field field--full">
              <span>Nome</span>
              <input
                onChange={(event) => handleInputChange("nome", event.target.value)}
                required
                type="text"
                value={formData.nome}
              />
            </label>

            <label className="field field--full">
              <span>Descrição (opcional)</span>
              <textarea
                onChange={(event) => handleInputChange("descricao", event.target.value)}
                rows={3}
                value={formData.descricao}
              />
            </label>

            <div className="field--full">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="button button--primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar Ingrediente"
                    : "Adicionar Ingrediente"}
                </button>
                {editingId && (
                  <button
                    className="button button--ghost"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Informações</span>
              <h2>Sobre Ingredientes</h2>
            </div>
          </div>

          <div className="rule-list">
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Ingredientes são usados para compor os itens do cardápio.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Cada ingrediente pode estar associado a múltiplos itens.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>A descrição é opcional e pode incluir informações como origem ou características especiais.</p>
            </div>
          </div>
        </section>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Lista de ingredientes</span>
            <h2>Ingredientes Cadastrados</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando ingredientes...</p>
          </div>
        ) : ingredientes.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum ingrediente cadastrado. Adicione seu primeiro ingrediente acima.</p>
          </div>
        ) : (
          <div className="history-list">
            {ingredientes.map((ingrediente) => (
              <article className="history-card" key={ingrediente.id}>
                <div className="history-card__header">
                  <div>
                    <strong>Ingrediente #{ingrediente.id}</strong>
                    <span>{ingrediente.nome}</span>
                  </div>
                </div>

                {ingrediente.descricao && (
                  <div className="summary-list summary-list--compact">
                    <div>
                      <span>Descrição</span>
                      <strong>{ingrediente.descricao}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="button button--ghost"
                    onClick={() => handleEdit(ingrediente)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="button button--ghost"
                    style={{ color: "var(--red)" }}
                    onClick={() => handleDelete(ingrediente.id)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  if (noShell) return <div className="page">{content}</div>;

  return (
    <AppShell contentClassName="page">
      {isAdmin ? content : (
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Acesso Restrito</span>
              <h2>Acesso Não Autorizado</h2>
            </div>
          </div>
          <div className="empty-state">
            <p>Esta página é restrita a administradores apenas.</p>
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default IngredientePage;