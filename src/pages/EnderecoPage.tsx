import { useEffect, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import {
  listarEnderecosDoUsuario,
  criarEndereco,
  atualizarEndereco,
  deletarEndereco,
} from "../services/EnderecoService";
import type { Endereco } from "../types/Endereco";
import type { EnderecoRequestDTO } from "../types/dto/endereco/EnderecoRequestDTO";
import { getErrorMessage } from "../utils/error";

const emptyAddress: EnderecoRequestDTO = {
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

const EnderecoPage = () => {
  const { usuario } = useAuth();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EnderecoRequestDTO>(emptyAddress);

  useEffect(() => {
    let isMounted = true;

    const loadAddresses = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (!usuario?.usuario?.id) {
          throw new Error("Usuário não autenticado.");
        }
        const data = await listarEnderecosDoUsuario(usuario.usuario.id);
        if (isMounted) {
          setEnderecos(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            getErrorMessage(
              error,
              "Não foi possível carregar os endereços."
            )
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [usuario?.usuario?.id]);

  const handleInputChange = <T extends keyof EnderecoRequestDTO>(
    field: T,
    value: EnderecoRequestDTO[T]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (endereco: Endereco) => {
    setEditingId(endereco.id);
    setFormData({
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento || "",
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      cep: endereco.cep,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyAddress);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!usuario?.usuario?.id) {
      setError("Usuário não autenticado.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await atualizarEndereco(usuario.usuario.id, editingId, formData);
        setEnderecos((prev) =>
          prev.map((end) =>
            end.id === editingId ? { ...end, ...formData } : end
          )
        );
        setSuccess("Endereço atualizado com sucesso.");
      } else {
        const novoEndereco = await criarEndereco(usuario.usuario.id, formData);
        setEnderecos((prev) => [...prev, novoEndereco]);
        setSuccess("Endereço criado com sucesso.");
      }

      setEditingId(null);
      setFormData(emptyAddress);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          editingId
            ? "Não foi possível atualizar o endereço."
            : "Não foi possível criar o endereço."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este endereço?")) {
      return;
    }

    if (!usuario?.usuario?.id) {
      setError("Usuário não autenticado.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deletarEndereco(usuario.usuario.id, id);
      setEnderecos((prev) => prev.filter((end) => end.id !== id));
      setSuccess("Endereço excluído com sucesso.");

      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyAddress);
      }
    } catch (error) {
      setError(
        getErrorMessage(error, "Não foi possível excluir o endereço.")
      );
    }
  };

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Endereços</span>
          <h1>Meus Endereços</h1>
          <p className="hero__lead">
            Gerencie seus endereços para delivery e reservas.
          </p>
        </div>
      </section>

      <div className="section-grid section-grid--two">
        <section className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">
                {editingId ? "Editar" : "Novo"} endereço
              </span>
              <h2>{editingId ? "Editar Endereço" : "Adicionar Endereço"}</h2>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field field--full">
              <span>Rua</span>
              <input
                onChange={(event) => handleInputChange("rua", event.target.value)}
                required
                type="text"
                value={formData.rua}
              />
            </label>

            <label className="field">
              <span>Número</span>
              <input
                onChange={(event) => handleInputChange("numero", event.target.value)}
                required
                type="text"
                value={formData.numero}
              />
            </label>

            <label className="field">
              <span>Complemento</span>
              <input
                onChange={(event) => handleInputChange("complemento", event.target.value)}
                type="text"
                value={formData.complemento}
              />
            </label>

            <label className="field">
              <span>Bairro</span>
              <input
                onChange={(event) => handleInputChange("bairro", event.target.value)}
                required
                type="text"
                value={formData.bairro}
              />
            </label>

            <label className="field">
              <span>Cidade</span>
              <input
                onChange={(event) => handleInputChange("cidade", event.target.value)}
                required
                type="text"
                value={formData.cidade}
              />
            </label>

            <label className="field">
              <span>Estado</span>
              <input
                onChange={(event) => handleInputChange("estado", event.target.value)}
                required
                type="text"
                maxLength={2}
                value={formData.estado}
              />
            </label>

            <label className="field field--full">
              <span>CEP</span>
              <input
                onChange={(event) => handleInputChange("cep", event.target.value)}
                required
                type="text"
                maxLength={8}
                value={formData.cep}
              />
            </label>

            <div className="field--full">
              <div className="button-group">
                <button
                  className="button button--primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar Endereço"
                    : "Adicionar Endereço"}
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
              <h2>Como usar endereços</h2>
            </div>
          </div>

          <div className="rule-list">
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Endereços são usados para delivery e para identificar sua localização.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>Você pode ter múltiplos endereços cadastrados.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>O CEP deve conter apenas números, sem traços ou pontos.</p>
            </div>
            <div className="rule-item">
              <span className="rule-item__index" />
              <p>O estado deve ser informado com duas letras (ex: SP, RJ, MG).</p>
            </div>
          </div>
        </section>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      <section className="panel panel--section">
        <div className="panel__header">
          <div>
            <span className="kicker">Lista de endereços</span>
            <h2>Endereços Cadastrados</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <span className="route-status__spinner" />
            <p>Carregando endereços...</p>
          </div>
        ) : enderecos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum endereço cadastrado. Adicione seu primeiro endereço acima.</p>
          </div>
        ) : (
          <div className="history-list">
            {enderecos.map((endereco) => (
              <article className="history-card" key={endereco.id}>
                <div className="history-card__header">
                  <div>
                    <strong>Endereço #{endereco.id}</strong>
                    <span>
                      {endereco.rua}, {endereco.numero}
                      {endereco.complemento && ` - ${endereco.complemento}`}
                    </span>
                  </div>
                </div>

                <div className="summary-list summary-list--compact">
                  <div>
                    <span>Bairro</span>
                    <strong>{endereco.bairro}</strong>
                  </div>
                  <div>
                    <span>Cidade/Estado</span>
                    <strong>
                      {endereco.cidade}/{endereco.estado}
                    </strong>
                  </div>
                  <div>
                    <span>CEP</span>
                    <strong>{endereco.cep}</strong>
                  </div>
                </div>

                <div className="button-group">
                  <button
                    className="button button--ghost"
                    onClick={() => handleEdit(endereco)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="button button--ghost button--danger"
                    onClick={() => handleDelete(endereco.id)}
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
    </AppShell>
  );
};

export default EnderecoPage;