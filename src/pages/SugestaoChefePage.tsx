import { useEffect, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  listarSugestoes,
  criarSugestao,
  deletarSugestao,
} from "../services/SugestaoChefe";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import type { SugestaoChefeRequestDTO } from "../types/dto/sugestao-chefe/SugestaoChefeRequestDTO";
import { getErrorMessage } from "../utils/error";
import { Periodo } from "../types/enums/Periodo";

const emptySuggestion: SugestaoChefeRequestDTO = {
  dataSugestao: new Date().toISOString().split("T")[0],
  periodo: Periodo.Almoco,
  itemCardapioId: 0,
};

const SugestaoChefePage = () => {
  const { isAdmin } = useAuth();
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<SugestaoChefeRequestDTO>(emptySuggestion);

  useEffect(() => {
    let isMounted = true;

    const loadSuggestions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await listarSugestoes();
        if (isMounted) {
          setSugestoes(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            getErrorMessage(
              error,
              "Não foi possível carregar as sugestões do chef."
            )
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = <T extends keyof SugestaoChefeRequestDTO>(
    field: T,
    value: SugestaoChefeRequestDTO[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isAdmin) {
      setError("Apenas administradores podem criar sugestões do chef.");
      return;
    }

    if (formData.itemCardapioId <= 0) {
      setError("Selecione um item do cardápio válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const novaSugestao = await criarSugestao(formData);
      setSugestoes((prev) => [...prev, novaSugestao]);
      setSuccess("Sugestão do chef criada com sucesso.");
      setFormData(emptySuggestion);
    } catch (error) {
      setError(
        getErrorMessage(error, "Não foi possível criar a sugestão do chef.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta sugestão do chef?")) {
      return;
    }

    if (!isAdmin) {
      setError("Apenas administradores podem excluir sugestões do chef.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deletarSugestao(id);
      setSugestoes((prev) => prev.filter((sug) => sug.id !== id));
      setSuccess("Sugestão do chef excluída com sucesso.");
    } catch (error) {
      setError(
        getErrorMessage(error, "Não foi possível excluir a sugestão do chef.")
      );
    }
  };

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Sugestões</span>
          <h1>Sugestões do Chef</h1>
          <p className="hero__lead">
            Descubra as recomendações especiais do nosso chef para cada dia.
          </p>
        </div>
      </section>

      {isAdmin && (
        <div className="section-grid section-grid--two">
          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Administração</span>
                <h2>Nova Sugestão do Chef</h2>
              </div>
            </div>

            <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
              <label className="field field--full">
                <span>Data da Sugestão</span>
                <input
                  onChange={(event) => handleInputChange("dataSugestao", event.target.value)}
                  required
                  type="date"
                  value={formData.dataSugestao}
                />
              </label>

              <label className="field field--full">
                <span>Período</span>
                <select
                  onChange={(event) => handleInputChange("periodo", parseInt(event.target.value) as Periodo)}
                  required
                  value={formData.periodo}
                >
                  <option value={Periodo.Almoco}>Almoço</option>
                  <option value={Periodo.Jantar}>Jantar</option>
                </select>
              </label>

              <label className="field field--full">
                <span>ID do Item do Cardápio</span>
                <input
                  onChange={(event) => handleInputChange("itemCardapioId", parseInt(event.target.value) || 0)}
                  required
                  type="number"
                  min="1"
                  placeholder="Digite o ID do item"
                  value={formData.itemCardapioId || ""}
                />
              </label>

              <div className="field--full">
                <div className="button-group">
                  <button
                    className="button button--primary"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Salvando..." : "Criar Sugestão"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Informações</span>
                <h2>Como funcionam as sugestões</h2>
              </div>
            </div>

            <div className="rule-list">
              <div className="rule-item">
                <span className="rule-item__index" />
                <p>As sugestões do chef são recomendações especiais para cada dia.</p>
              </div>
              <div className="rule-item">
                <span className="rule-item__index" />
                <p>Cada sugestão está associada a um item específico do cardápio.</p>
              </div>
              <div className="rule-item">
                <span className="rule-item__index" />
                <p>É necessário informar o ID do item do cardápio correspondente.</p>
              </div>
              <div className="rule-item">
                <span className="rule-item__index" />
                <p>Apenas administradores podem criar ou excluir sugestões.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Lista de sugestões</span>
            <h2>Sugestões do Chef</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando sugestões...</p>
          </div>
        ) : sugestoes.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma sugestão do chef disponível no momento.</p>
          </div>
        ) : (
          <div className="history-list">
            {sugestoes.map((sugestao) => (
              <article className="history-card" key={sugestao.id}>
                <div className="history-card__header">
                  <div>
                    <strong>Sugestão #{sugestao.id}</strong>
                    <span>
                      {new Date(sugestao.dataSugestao).toLocaleDateString("pt-BR")} -{" "}
                      {sugestao.periodo === Periodo.Almoco ? "Almoço" : "Jantar"}
                    </span>
                  </div>
                </div>

                <div className="summary-list summary-list--compact">
                  <div>
                    <span>Item Recomendado</span>
                    <strong>{sugestao.nomeItem}</strong>
                  </div>
                  <div>
                    <span>Data</span>
                    <strong>
                      {new Date(sugestao.dataSugestao).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                  <div>
                    <span>Período</span>
                    <strong>
                      {sugestao.periodo === Periodo.Almoco ? "Almoço" : "Jantar"}
                    </strong>
                  </div>
                </div>

                {isAdmin && (
                  <div className="button-group">
                    <button
                      className="button button--ghost button--danger"
                      onClick={() => handleDelete(sugestao.id)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default SugestaoChefePage;