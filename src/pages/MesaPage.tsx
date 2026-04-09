import { useEffect, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  listarMesas,
  criarMesa,
  atualizarMesa,
  deletarMesa,
} from "../services/MesaService";
import type { Mesa } from "../types/Mesa";
import type { MesaRequestDTO } from "../types/dto/mesa/MesaRequestDTO";
import { getErrorMessage } from "../utils/error";

const emptyTable: MesaRequestDTO = {
  numero: 0,
  capacidade: 0,
};

interface MesaPageProps {
  noShell?: boolean;
}

const MesaPage = ({ noShell }: MesaPageProps = {}) => {
  const { isAdmin } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MesaRequestDTO>(emptyTable);

  useEffect(() => {
    let isMounted = true;

    const loadTables = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await listarMesas();
        if (isMounted) {
          setMesas(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            getErrorMessage(
              error,
              "Não foi possível carregar as mesas."
            )
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTables();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = <T extends keyof MesaRequestDTO>(
    field: T,
    value: MesaRequestDTO[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (mesa: Mesa) => {
    setEditingId(mesa.id);
    setFormData({
      numero: mesa.numero,
      capacidade: mesa.capacidade,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyTable);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isAdmin) {
      setError("Apenas administradores podem gerenciar mesas.");
      return;
    }

    if (formData.numero <= 0) {
      setError("O número da mesa deve ser maior que zero.");
      return;
    }

    if (formData.capacidade <= 0) {
      setError("A capacidade da mesa deve ser maior que zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await atualizarMesa(editingId, formData);
        setMesas((prev) =>
          prev.map((mesa) =>
            mesa.id === editingId ? { ...mesa, ...formData } : mesa
          )
        );
        setSuccess("Mesa atualizada com sucesso.");
      } else {
        const novaMesa = await criarMesa(formData);
        setMesas((prev) => [...prev, novaMesa]);
        setSuccess("Mesa criada com sucesso.");
      }

      setEditingId(null);
      setFormData(emptyTable);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          editingId
            ? "Não foi possível atualizar a mesa."
            : "Não foi possível criar a mesa."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta mesa?")) {
      return;
    }

    if (!isAdmin) {
      setError("Apenas administradores podem excluir mesas.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deletarMesa(id);
      setMesas((prev) => prev.filter((mesa) => mesa.id !== id));
      setSuccess("Mesa excluída com sucesso.");

      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyTable);
      }
    } catch (error) {
      setError(
        getErrorMessage(error, "Não foi possível excluir a mesa.")
      );
    }
  };

  const content = (
    <>
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Mesas</span>
          <h1>Gerenciamento de Mesas</h1>
          <p className="hero__lead">
            Gerencie as mesas disponíveis no restaurante para reservas.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">
                {editingId ? "Editar" : "Nova"} mesa
              </span>
              <h2>{editingId ? "Editar Mesa" : "Adicionar Mesa"}</h2>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field">
              <span>Número da Mesa</span>
              <input
                onChange={(event) => handleInputChange("numero", parseInt(event.target.value) || 0)}
                required
                type="number"
                min="1"
                value={formData.numero || ""}
              />
            </label>

            <label className="field">
              <span>Capacidade (pessoas)</span>
              <input
                onChange={(event) => handleInputChange("capacidade", parseInt(event.target.value) || 0)}
                required
                type="number"
                min="1"
                value={formData.capacidade || ""}
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
                    ? "Atualizar Mesa"
                    : "Adicionar Mesa"}
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
              <h2>Sobre Mesas</h2>
            </div>
          </div>

          <div className="rule-list">
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Mesas são usadas para reservas no restaurante.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Cada mesa tem um número único e uma capacidade máxima de pessoas.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>A capacidade determina quantas pessoas podem se sentar na mesa.</p>
            </div>
          </div>
        </section>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Lista de mesas</span>
            <h2>Mesas Cadastradas</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando mesas...</p>
          </div>
        ) : mesas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma mesa cadastrada. Adicione sua primeira mesa acima.</p>
          </div>
        ) : (
          <div className="history-list">
            {mesas.map((mesa) => (
              <article className="history-card" key={mesa.id}>
                <div className="history-card__header">
                  <div>
                    <strong>Mesa #{mesa.id}</strong>
                    <span>Número: {mesa.numero}</span>
                  </div>
                </div>

                <div className="summary-list summary-list--compact">
                  <div>
                    <span>Número</span>
                    <strong>{mesa.numero}</strong>
                  </div>
                  <div>
                    <span>Capacidade</span>
                    <strong>{mesa.capacidade} pessoas</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="button button--ghost"
                    onClick={() => handleEdit(mesa)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="button button--ghost"
                    style={{ color: "var(--red)" }}
                    onClick={() => handleDelete(mesa.id)}
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

export default MesaPage;