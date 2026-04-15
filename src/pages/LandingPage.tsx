import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../contexts/useAuth";
import { listarItensCardapio } from "../services/ItemCardapioService";
import { listarSugestoes } from "../services/SugestaoChefe";
import type { ItemCardapio } from "../types/ItemCardapio";
import type { SugestaoChefe } from "../types/SugestaoChefe";
import { Periodo } from "../types/enums/Periodo";
import {
  formatCurrency,
  isSameDate,
  toDateInputValue,
} from "../utils/formatters";

const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoChefe[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingMenu(true);
      const [itensR, sugR] = await Promise.allSettled([
        listarItensCardapio(),
        listarSugestoes(),
      ]);
      if (!mounted) return;
      if (itensR.status === "fulfilled") setItens(itensR.value);
      if (sugR.status === "fulfilled") setSugestoes(sugR.value);
      setLoadingMenu(false);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const itensAlmoco = useMemo(() => itens.filter((i) => i.periodo === Periodo.Almoco), [itens]);
  const itensJantar = useMemo(() => itens.filter((i) => i.periodo === Periodo.Jantar), [itens]);

  const sugestoesAtivas = useMemo(() => {
    const today = toDateInputValue(new Date());
    const hoje = sugestoes.filter((s) => isSameDate(s.dataSugestao, today));
    const fbAlm = itensAlmoco.find((i) => i.ehSugestaoDoChefe);
    const fbJan = itensJantar.find((i) => i.ehSugestaoDoChefe);
    return {
      almoco: hoje.find((s) => s.periodo === Periodo.Almoco)?.nomeItem ?? fbAlm?.nome ?? null,
      jantar: hoje.find((s) => s.periodo === Periodo.Jantar)?.nomeItem ?? fbJan?.nome ?? null,
    };
  }, [itensAlmoco, itensJantar, sugestoes]);

  const previewAlmoco = itensAlmoco.slice(0, 3);
  const previewJantar = itensJantar.slice(0, 3);

  const renderCardapioPreview = (periodoLabel: string, items: ItemCardapio[]) => (
    <div className="cardapio-section">
      <h3 className="cardapio-section__title">{periodoLabel}</h3>
      {items.map((item) => {
        const precoFinal = item.ehSugestaoDoChefe ? item.precoBase * 0.8 : item.precoBase;
        return (
          <div className={`cardapio-item${item.ehSugestaoDoChefe ? " cardapio-item--chef" : ""}`} key={item.id}>
            <div className="cardapio-item__row">
              <span className="cardapio-item__name">{item.nome}</span>
              <span className="cardapio-item__dots" />
              <span className="cardapio-item__price">
                {item.ehSugestaoDoChefe && (
                  <span className="cardapio-item__price--original">{formatCurrency(item.precoBase)}</span>
                )}
                {formatCurrency(precoFinal)}
              </span>
            </div>
            {item.ehSugestaoDoChefe && (
              <span className="cardapio-chef-badge">
                <em className="cardapio-chef-star">&#9733;</em> Sugestao do Chefe — 20% off
              </span>
            )}
            <p className="cardapio-item__desc">{item.descricao}</p>
            {item.ingredientes?.length > 0 && (
              <p className="cardapio-item__ingredients">{item.ingredientes.join(" · ")}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <AppShell contentClassName="landing-content">
      {/* ── HERO ── */}
      <section className="landing-hero">
        <video
          className="landing-hero__video"
          src="/fundohome.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="landing-hero__overlay" />

        <div className="landing-hero__inner">
          <div className="landing-hero__text">
            <h1 className="landing-hero__title">
              Corte perfeito,<br />sabor perfeito
            </h1>
            <p className="landing-hero__desc">
              Descubra a melhor gastronomia com ingredientes selecionados e
              cortes que fazem a diferenca.
            </p>
            <Link to="/cardapio" className="btn btn--primary btn--lg">
              Ver Cardapio
            </Link>
          </div>
        </div>

        {/* Cards inferiores */}
        <div className="landing-hero__cards">
          <Link to="/cardapio" className="landing-card">
            <div className="landing-card__content">
              <h3>Sugestao do Chefe</h3>
              <span className="landing-card__badge">20% OFF</span>
              <p>
                {sugestoesAtivas.almoco
                  ? `${sugestoesAtivas.almoco} — desconto especial no almoco`
                  : "Desconto especial em pratos selecionados pelo chef."}
              </p>
            </div>
          </Link>

          <Link to={isAuthenticated ? "/reservas" : "/login"} className="landing-card">
            <div className="landing-card__content">
              <h3>Delivery e Reservas</h3>
              <p>
                Peca para entrega ou reserve sua mesa para o almoco entre 11h e 14h.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="stats-row animate-in">
            <div className="stat-item">
              <span className="stat-item__value">{itens.length}</span>
              <span className="stat-item__label">Itens no cardapio</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">20%</span>
              <span className="stat-item__label">Desconto do chefe</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">3</span>
              <span className="stat-item__label">Tipos de atendimento</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">11h-14h</span>
              <span className="stat-item__label">Reservas de almoco</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="landing-section landing-section--alt landing-section--hero-bg">
        <div className="landing-section__inner">
          <div className="section__header animate-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section__label" style={{ justifyContent: "center" }}>Atendimento</span>
            <h2 className="section__title" style={{ margin: "0 auto" }}>Como funciona</h2>
            <p className="section__subtitle" style={{ margin: "0.5rem auto 0", textAlign: "center" }}>
              Tres formas de pedir: presencial, delivery proprio ou via aplicativos parceiros.
            </p>
          </div>

          <div className="modes-grid">
            {[
              { icon: "\u{1F37D}", title: "Presencial", desc: "Faca seu pedido diretamente no restaurante. Atendimento imediato sem taxas adicionais." },
              { icon: "\u{1F6F5}", title: "Delivery Proprio", desc: "Entrega pela equipe do restaurante com taxa fixa de R$12, para qualquer endereco." },
              { icon: "\u{1F4F1}", title: "Delivery por App", desc: "Pedido integrado a parceiros como iFood. Comissao de 4% no almoco e 6% no jantar." },
            ].map((m, i) => (
              <div className={`mode-card animate-in animate-in-delay-${i + 1}`} key={m.title}>
                <div className="mode-card__icon">{m.icon}</div>
                <h3 className="mode-card__title">{m.title}</h3>
                <p className="mode-card__desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARDAPIO PREVIEW ── */}
      <section className="landing-section landing-section--cardapio-bg">
        <div className="landing-section__inner">
          <div className="section__header animate-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section__label" style={{ justifyContent: "center" }}>Nosso Menu</span>
            <h2 className="section__title" style={{ margin: "0 auto" }}>Uma amostra do nosso cardapio</h2>
            <p className="section__subtitle" style={{ margin: "0.5rem auto 0", textAlign: "center" }}>
              Confira alguns pratos. Para ver o cardapio completo, visite a pagina dedicada.
            </p>
          </div>

          {loadingMenu ? (
            <div className="loading-box">
              <span className="spinner" />
              <span>Carregando cardapio...</span>
            </div>
          ) : (
            <>
              <div className="cardapio-book animate-in">
                <div className="cardapio-header">
                  <div className="cardapio-ornament"><span className="cardapio-ornament-diamond" /></div>
                  <h2>Cardapio</h2>
                  <p>Selecao exclusiva do nosso chef</p>
                  <div className="cardapio-ornament"><span className="cardapio-ornament-diamond" /></div>
                </div>

                {previewAlmoco.length > 0 && renderCardapioPreview("Almoco", previewAlmoco)}
                {previewAlmoco.length > 0 && previewJantar.length > 0 && (
                  <div className="cardapio-divider"><span className="cardapio-divider-icon" /></div>
                )}
                {previewJantar.length > 0 && renderCardapioPreview("Jantar", previewJantar)}

                <div className="cardapio-ornament" style={{ marginTop: "2rem" }}>
                  <span className="cardapio-ornament-diamond" />
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link to="/cardapio" className="btn btn--primary btn--lg">
                  Ver cardapio completo ({itens.length} itens)
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTAs ── */}
      <section className="landing-section landing-section--alt landing-section--salao-bg">
        <div className="landing-section__inner">
          <div className="section__header animate-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section__label" style={{ justifyContent: "center" }}>Plataforma</span>
            <h2 className="section__title" style={{ margin: "0 auto" }}>Tudo em um so lugar</h2>
          </div>

          <div className="cta-grid">
            <Link to="/cardapio" className="cta-card-landing animate-in animate-in-delay-1">
              <div className="cta-card-landing__icon">&#128203;</div>
              <div>
                <h3>Cardapio Completo</h3>
                <p>Todos os pratos, ingredientes, precos e destaques do chefe.</p>
              </div>
              <span className="cta-card-landing__arrow">&rarr;</span>
            </Link>
            <Link to={isAuthenticated ? "/pedidos" : "/login"} className="cta-card-landing animate-in animate-in-delay-2">
              <div className="cta-card-landing__icon">&#128230;</div>
              <div>
                <h3>Fazer Pedido</h3>
                <p>Monte seu pedido com periodo, atendimento e resumo financeiro.</p>
              </div>
              <span className="cta-card-landing__arrow">&rarr;</span>
            </Link>
            <Link to={isAuthenticated ? "/reservas" : "/login"} className="cta-card-landing animate-in animate-in-delay-3">
              <div className="cta-card-landing__icon">&#128197;</div>
              <div>
                <h3>Reservar Mesa</h3>
                <p>Agende para o almoco entre 11h e 14h com antecedencia.</p>
              </div>
              <span className="cta-card-landing__arrow">&rarr;</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="cta-card-landing animate-in animate-in-delay-4">
                <div className="cta-card-landing__icon">&#128202;</div>
                <div>
                  <h3>Painel Administrativo</h3>
                  <p>Usuarios, sugestao do chefe e relatorios de faturamento.</p>
                </div>
                <span className="cta-card-landing__arrow">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      {!isAuthenticated && (
        <section className="landing-section">
          <div className="landing-section__inner" style={{ textAlign: "center" }}>
            <div className="final-cta animate-in">
              <span className="section__label" style={{ justifyContent: "center" }}>Comece agora</span>
              <h2 className="section__title" style={{ margin: "0 auto 0.5rem" }}>Pronto para experimentar?</h2>
              <p className="section__subtitle" style={{ margin: "0 auto 2rem", textAlign: "center" }}>
                Crie sua conta em segundos e tenha acesso completo.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/cadastro" className="btn btn--primary btn--lg">Criar conta gratis</Link>
                <Link to="/login" className="btn btn--secondary btn--lg">Ja tenho conta</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default LandingPage;
