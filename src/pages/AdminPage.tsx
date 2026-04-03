import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import { listarItensCardapio } from "../services/ItemCardapioService";
import { faturamentoPorTipo, itensMaisVendidos } from "../services/RelatorioService";
import { criarSugestao, listarSugestoes } from "../services/SugestaoChefe";
import { listarUsuarios } from "../services/UsuarioService";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import type { Usuario } from "../types/Usuario";
import { Periodo } from "../types/enums/Periodo";
import { getErrorMessage } from "../utils/error";
import { formatDate, getPeriodoLabel, toDateInputValue } from "../utils/formatters";

const today = new Date();
const lastWeek = new Date();
lastWeek.setDate(today.getDate() - 7);

const stringifyValue = (value: unknown) => {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR");
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, currentValue]) => `${key}: ${String(currentValue)}`)
      .join(" | ");
  }

  return "--";
};

const AdminPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [faturamento, setFaturamento] = useState<unknown>(null);
  const [itensVendidos, setItensVendidos] = useState<unknown>(null);
  const [rangeStart, setRangeStart] = useState(toDateInputValue(lastWeek));
  const [rangeEnd, setRangeEnd] = useState(toDateInputValue(today));
  const [sugestaoPeriodo, setSugestaoPeriodo] = useState<Periodo>(Periodo.Almoco);
  const [sugestaoData, setSugestaoData] = useState(toDateInputValue(today));
  const [itemSugestaoId, setItemSugestaoId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboard = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    const [usuariosResult, itensResult, sugestoesResult, faturamentoResult, itensResultReport] =
      await Promise.allSettled([
        listarUsuarios(),
        listarItensCardapio(),
        listarSugestoes(),
        faturamentoPorTipo(rangeStart, rangeEnd),
        itensMaisVendidos(),
      ]);

    if (usuariosResult.status === "fulfilled") {
      setUsuarios(usuariosResult.value);
    }

    if (itensResult.status === "fulfilled") {
      setItens(itensResult.value);
    }

    if (sugestoesResult.status === "fulfilled") {
      setSugestoes(sugestoesResult.value);
    }

    if (faturamentoResult.status === "fulfilled") {
      setFaturamento(faturamentoResult.value);
    }

    if (itensResultReport.status === "fulfilled") {
      setItensVendidos(itensResultReport.value);
    }

    const firstRejected = [
      usuariosResult,
      itensResult,
      sugestoesResult,
      faturamentoResult,
      itensResultReport,
    ].find((result) => result.status === "rejected");

    if (firstRejected?.status === "rejected") {
      setError(
        getErrorMessage(
          firstRejected.reason,
          "Alguns dados administrativos nao puderam ser carregados."
        )
      );
    }

    if (refreshing) {
      setIsRefreshing(false);
    } else {
      setIsLoading(false);
    }
  }, [rangeEnd, rangeStart]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const availableSuggestionItems = useMemo(
    () => itens.filter((item) => item.periodo === sugestaoPeriodo),
    [itens, sugestaoPeriodo]
  );

  useEffect(() => {
    if (!availableSuggestionItems.length) {
      setItemSugestaoId(0);
      return;
    }

    const isSelectedItemStillValid = availableSuggestionItems.some(
      (item) => item.id === itemSugestaoId
    );

    if (!isSelectedItemStillValid) {
      setItemSugestaoId(availableSuggestionItems[0].id);
    }
  }, [availableSuggestionItems, itemSugestaoId]);

  const dashboardStats = useMemo(
    () => [
      { label: "Usuarios", value: usuarios.length.toString() },
      { label: "Itens de cardapio", value: itens.length.toString() },
      { label: "Sugestoes cadastradas", value: sugestoes.length.toString() },
      {
        label: "Sugestoes ativas no cardapio",
        value: itens.filter((item) => item.ehSugestaoDoChefe).length.toString(),
      },
    ],
    [itens, sugestoes.length, usuarios.length]
  );

  const renderReport = (title: string, data: unknown) => {
    if (!data) {
      return (
        <article className="panel panel--soft">
          <strong>{title}</strong>
          <p>Sem dados disponiveis para esse relatorio.</p>
        </article>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="report-grid">
          {data.map((item, index) => (
            <article className="panel panel--soft" key={`${title}-${index}`}>
              <strong>{title} #{index + 1}</strong>
              {item && typeof item === "object" ? (
                <div className="data-list">
                  {Object.entries(item as Record<string, unknown>).map(([key, value]) => (
                    <div className="data-list__row" key={key}>
                      <span>{key}</span>
                      <strong>{stringifyValue(value)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{stringifyValue(item)}</p>
              )}
            </article>
          ))}
        </div>
      );
    }

    if (data && typeof data === "object") {
      return (
        <div className="report-grid">
          {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
            <article className="panel panel--soft" key={`${title}-${key}`}>
              <strong>{key}</strong>
              <p>{stringifyValue(value)}</p>
            </article>
          ))}
        </div>
      );
    }

    return (
      <article className="panel panel--soft">
        <strong>{title}</strong>
        <p>{stringifyValue(data)}</p>
      </article>
    );
  };

  const handleRefreshReports = async () => {
    await loadDashboard(true);
  };

  const handleCreateSuggestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!itemSugestaoId) {
      setError("Selecione um item valido para a sugestao do chefe.");
      return;
    }

    setIsSavingSuggestion(true);

    try {
      await criarSugestao({
        dataSugestao: sugestaoData,
        periodo: sugestaoPeriodo,
        itemCardapioId: itemSugestaoId,
      });

      const updatedSuggestions = await listarSugestoes();
      setSugestoes(updatedSuggestions);
      setSuccess("Sugestao do chefe cadastrada com sucesso.");
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Nao foi possivel salvar a sugestao do chefe."
        )
      );
    } finally {
      setIsSavingSuggestion(false);
    }
  };

  return (
    <AppShell contentClassName="page">
      <section className="hero hero--compact">
        <div className="hero__content">
          <span className="kicker">Painel administrativo</span>
          <h1>Usuarios, sugestoes e relatorios em uma tela pronta para defender o projeto.</h1>
          <p className="hero__lead">
            O admin consolida os dados mais importantes da API e da regra de
            negocio, com foco em leitura rapida e visual forte para a entrega.
          </p>
        </div>
      </section>

      <section className="card-grid card-grid--four">
        {dashboardStats.map((stat) => (
          <article className="stat-card stat-card--panel" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      {error ? <div className="message message--error">{error}</div> : null}
      {success ? <div className="message message--success">{success}</div> : null}

      {isLoading ? (
        <div className="loading-state panel">
          <span className="route-status__spinner" />
          <p>Carregando painel administrativo...</p>
        </div>
      ) : (
        <>
          <div className="section-grid section-grid--two">
            <section className="panel panel--section">
              <div className="panel__header">
                <div>
                  <span className="kicker">Relatorios</span>
                  <h2>Consulta por intervalo</h2>
                </div>

                <button
                  className="button button--ghost"
                  onClick={handleRefreshReports}
                  type="button"
                >
                  {isRefreshing ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Data inicial</span>
                  <input
                    onChange={(event) => setRangeStart(event.target.value)}
                    type="date"
                    value={rangeStart}
                  />
                </label>

                <label className="field">
                  <span>Data final</span>
                  <input
                    onChange={(event) => setRangeEnd(event.target.value)}
                    type="date"
                    value={rangeEnd}
                  />
                </label>
              </div>

              {renderReport("Faturamento por tipo", faturamento)}
              {renderReport("Itens mais vendidos", itensVendidos)}
            </section>

            <section className="panel panel--section">
              <div className="panel__header">
                <div>
                  <span className="kicker">Sugestao do chefe</span>
                  <h2>Cadastrar destaque do dia</h2>
                </div>
              </div>

              <form className="form-grid form-grid--two" onSubmit={handleCreateSuggestion}>
                <label className="field">
                  <span>Data</span>
                  <input
                    onChange={(event) => setSugestaoData(event.target.value)}
                    type="date"
                    value={sugestaoData}
                  />
                </label>

                <label className="field">
                  <span>Periodo</span>
                  <select
                    onChange={(event) =>
                      setSugestaoPeriodo(Number(event.target.value) as Periodo)
                    }
                    value={sugestaoPeriodo}
                  >
                    <option value={Periodo.Almoco}>Almoco</option>
                    <option value={Periodo.Jantar}>Jantar</option>
                  </select>
                </label>

                <label className="field field--full">
                  <span>Item do cardapio</span>
                  <select
                    onChange={(event) => setItemSugestaoId(Number(event.target.value))}
                    value={itemSugestaoId}
                  >
                    {availableSuggestionItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="button button--primary button--block field--full"
                  disabled={isSavingSuggestion}
                  type="submit"
                >
                  {isSavingSuggestion ? "Salvando..." : "Registrar sugestao"}
                </button>
              </form>

              <div className="history-list history-list--compact">
                {sugestoes.slice(0, 6).map((sugestao) => (
                  <article className="history-card" key={sugestao.id}>
                    <div className="history-card__header">
                      <div>
                        <strong>{sugestao.nomeItem}</strong>
                        <span>{formatDate(sugestao.dataSugestao)}</span>
                      </div>

                      <span className="pill pill--highlight">
                        {getPeriodoLabel(sugestao.periodo)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="panel panel--section">
            <div className="panel__header">
              <div>
                <span className="kicker">Usuarios cadastrados</span>
                <h2>Base de clientes</h2>
              </div>
            </div>

            {usuarios.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum usuario retornado pela API.</p>
              </div>
            ) : (
              <div className="card-grid card-grid--three">
                {usuarios.map((usuario) => (
                  <article className="panel panel--soft" key={usuario.id}>
                    <strong>{usuario.nome}</strong>
                    <p>{usuario.email}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
};

export default AdminPage;
