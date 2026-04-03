import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { listarItensCardapio } from "../services/ItemCardapioService";
import { listarSugestoes } from "../services/SugestaoChefe";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import { Periodo } from "../types/enums/Periodo";
import { getErrorMessage } from "../utils/error";
import {
  formatCurrency,
  getPeriodoLabel,
  isSameDate,
  toDateInputValue,
} from "../utils/formatters";

const serviceModes = [
  {
    title: "Presencial",
    text: "Pedidos no restaurante com fluxo rapido para atendimento em mesa e operacao local.",
  },
  {
    title: "Delivery proprio",
    text: "Experiencia de entrega com taxa fixa, observacao de endereco e rastreio administrativo.",
  },
  {
    title: "Delivery por aplicativo",
    text: "Pedido integrado a parceiros com comissao variavel por periodo e destaque comercial.",
  },
];

const businessRules = [
  "Somente um item de almoco e um item de jantar podem ser Sugestao do Chefe por dia.",
  "O desconto de 20% so vale para o periodo e a data corretos.",
  "Reservas ficam concentradas na faixa do jantar, entre 19h e 22h.",
  "Cada pedido respeita o periodo escolhido e calcula taxa de atendimento.",
];

const CardapioPage = () => {
  const { isAuthenticated } = useAuth();
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      const [itensResult, sugestoesResult] = await Promise.allSettled([
        listarItensCardapio(),
        listarSugestoes(),
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
            "Nao foi possivel carregar o cardapio."
          )
        );
      }

      if (sugestoesResult.status === "fulfilled") {
        setSugestoes(sugestoesResult.value);
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

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
      {
        value: `${itens.length}`,
        label: "itens conectados ao backend",
      },
      {
        value: "20%",
        label: "desconto da sugestao do chefe",
      },
      {
        value: "3",
        label: "modos de atendimento da operacao",
      },
      {
        value: "19h-22h",
        label: "janela sugerida para reservas",
      },
    ],
    [itens.length]
  );

  const renderItemGrid = (periodoLabel: string, menu: ItemCardapio[]) => (
    <section className="panel panel--section">
      <div className="panel__header">
        <div>
          <span className="kicker">{periodoLabel}</span>
          <h2>{periodoLabel} com cara de produto final</h2>
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
                <div className="menu-card__head">
                  <div>
                    <span className="pill pill--outline">
                      {getPeriodoLabel(item.periodo)}
                    </span>

                    {item.ehSugestaoDoChefe ? (
                      <span className="pill pill--highlight">
                        Sugestao do Chefe
                      </span>
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <AppShell contentClassName="page page--landing">
      <section className="hero hero--landing">
        <div className="hero__content">
          <span className="kicker">A1 | Sistema de Gestao de Restaurante</span>
          <h1>Landing page, cardapio e fluxo do restaurante no mesmo pulso.</h1>
          <p className="hero__lead">
            O front do CodeFood agora apresenta o trabalho com visual proprio,
            leitura clara das regras de negocio e portas de entrada para
            cadastro, pedidos, reservas e administracao.
          </p>

          <div className="hero__actions">
            <Link
              className="button button--primary"
              to={isAuthenticated ? "/pedidos" : "/cadastro"}
            >
              {isAuthenticated ? "Montar pedido" : "Criar conta"}
            </Link>

            <Link
              className="button button--secondary"
              to={isAuthenticated ? "/reservas" : "/login"}
            >
              {isAuthenticated ? "Reservar jantar" : "Entrar na plataforma"}
            </Link>
          </div>

          <div className="hero__stats">
            {dashboardStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="hero__media panel">
          <div className="hero__logo-card">
            <img src="/codefood.png" alt="Logo CodeFood" />
          </div>

          <div className="hero__spotlight">
            <div>
              <span className="kicker">Sugestao do dia</span>
              <h2>Dois destaques prontos para aparecer no pitch</h2>
            </div>

            <div className="spotlight-grid">
              <article className="spotlight-card spotlight-card--amber">
                <span className="pill pill--highlight">Almoco</span>
                <strong>{sugestoesAtivas.almoco}</strong>
                <p>Com desconto automatico de 20% aplicado na experiencia.</p>
              </article>

              <article className="spotlight-card spotlight-card--red">
                <span className="pill pill--highlight">Jantar</span>
                <strong>{sugestoesAtivas.jantar}</strong>
                <p>Pronto para ganhar destaque na vitrine e no fechamento.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {serviceModes.map((mode) => (
          <article className="panel feature-card" key={mode.title}>
            <span className="kicker">Atendimento</span>
            <h2>{mode.title}</h2>
            <p>{mode.text}</p>
          </article>
        ))}
      </section>

      <section className="section-grid section-grid--two">
        <article className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Regras de negocio</span>
              <h2>O que a banca espera ver funcionando</h2>
            </div>
          </div>

          <div className="rule-list">
            {businessRules.map((rule) => (
              <div className="rule-item" key={rule}>
                <span className="rule-item__index" />
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel--section">
          <div className="panel__header">
            <div>
              <span className="kicker">Entrada do usuario</span>
              <h2>Fluxos principais do trabalho</h2>
            </div>
          </div>

          <div className="cta-stack">
            <Link className="cta-card" to="/cadastro">
              <strong>Cadastro e login</strong>
              <p>Onboarding com criacao de conta e primeiro endereco opcional.</p>
            </Link>

            <Link className="cta-card" to="/pedidos">
              <strong>Pedidos por periodo</strong>
              <p>Seleciona itens, atendimento e fecha o pedido na API.</p>
            </Link>

            <Link className="cta-card" to="/reservas">
              <strong>Reserva de jantar</strong>
              <p>Formulario com validacao de horario, mesa e antecedencia.</p>
            </Link>

            <Link className="cta-card" to="/admin">
              <strong>Admin e relatorios</strong>
              <p>Usuarios, sugestao do chefe e indicadores prontos para apresentar.</p>
            </Link>
          </div>
        </article>
      </section>

      {error ? <div className="message message--error">{error}</div> : null}

      {isLoading ? (
        <div className="loading-state panel">
          <span className="route-status__spinner" />
          <p>Carregando o cardapio conectado ao backend...</p>
        </div>
      ) : (
        <section className="section-stack">
          {renderItemGrid("Almoco", itensAlmoco)}
          {renderItemGrid("Jantar", itensJantar)}
        </section>
      )}
    </AppShell>
  );
};

export default CardapioPage;
