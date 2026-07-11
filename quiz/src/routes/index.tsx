import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QuizLayout } from "@/components/QuizLayout";
import { OptionCard, OptionLabel } from "@/components/QuizCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { screens } from "@/lib/quiz-data";
import { BrandLogo, brandLogoAssets } from "@/components/BrandLogo";
import { BreakingChain } from "@/components/ChainProgress";
import { PremiumChainLoader } from "@/components/PremiumChainLoader";
import homemAsset from "@/assets/homem.webp.asset.json";
import mulherAsset from "@/assets/mulher.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getSessionId,
  initSession,
  trackClick,
  recordScreenTime,
  recordScrollDepth,
  linkLeadToSession,
  getVariant,
} from "@/lib/tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imersão Primeira Arrematação — Descubra se você está pronto(a)" },
      {
        name: "description",
        content:
          "Responda o quiz de 2 minutos e descubra se você pode conquistar seu primeiro imóvel ou carro pagando até 60% menos, através do método de Juliano Carvalho.",
      },
      { property: "og:title", content: "Imersão Primeira Arrematação — Juliano Carvalho" },
      {
        property: "og:description",
        content:
          "Diagnóstico personalizado dos bloqueios que estão te impedindo de conquistar seu primeiro imóvel ou carro em leilão.",
      },
      { property: "og:image", content: "https://julianocarvalho.lovable.app/__l5e/assets-v1/ec190a31-f3fd-4adc-8304-ab9c8ac6155e/juliano-symbol.webp" },
      { name: "twitter:image", content: "https://julianocarvalho.lovable.app/__l5e/assets-v1/ec190a31-f3fd-4adc-8304-ab9c8ac6155e/juliano-symbol.webp" },
    ],

    links: [
      { rel: "preload", as: "image", href: brandLogoAssets.evento, fetchpriority: "high" },
      { rel: "preload", as: "image", href: homemAsset.url },
      { rel: "preload", as: "image", href: mulherAsset.url },
    ],
  }),
  component: QuizPage,
});

type Answers = Record<string, string | string[]>;

// Telas que pontuam (prontidão pra arrematar). Cada single vale 0-3; cada scale vale 1-5.
const SCORED_SCREENS = [
  "situacao_atual",
  "frequencia_pensamento",
  "padrao_desistir",
  "tempo_dinheiro",
  "nivel_conhecimento",
  "escala_arriscado",
  "medo_leilao",
  "autoconfianca",
  "oportunidade_perdida",
  "tempo_para_conquistar",
];



function calculateLevel(answers: Answers) {
  let score = 0;
  for (const id of SCORED_SCREENS) {
    const v = answers[id];
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) score += n;
    }
  }
  // Range aproximado: 0–31.
  // Nível 1 Baixo · Nível 2 Iniciante · Nível 3 Preparado(a) · Nível 4 Pronto(a)
  let level: 1 | 2 | 3 | 4 = 1;
  if (score >= 27) level = 4;
  else if (score >= 20) level = 3;
  else if (score >= 12) level = 2;
  return { score, level };
}

type VariantCopy = { headline: string; sub_headline: string };
type VariantKey = "A" | "B" | "C" | "D" | "E";

function renderBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <span key={i} className="text-primary font-semibold">
          {p.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function QuizPage() {
  const router = useRouter();
  const [restored, setRestored] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [abCopy, setAbCopy] = useState<Partial<Record<VariantKey, VariantCopy>>>({});

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("ab_variants" as never)
      .select("variant,headline,sub_headline")
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Partial<Record<VariantKey, VariantCopy>> = {};
        for (const row of data as Array<{ variant: string; headline: string; sub_headline: string }>) {
          if (["A", "B", "C", "D", "E"].includes(row.variant)) {
            map[row.variant as VariantKey] = { headline: row.headline, sub_headline: row.sub_headline };
          }
        }
        setAbCopy(map);
      });
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    try {
      // Sempre recomeçar o quiz do início ao recarregar a página
      sessionStorage.removeItem("juliano_step");
      sessionStorage.removeItem("juliano_answers");
      setStep(0);
      setAnswers({});
    } catch {
      setStep(0);
      setAnswers({});
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem("juliano_step", String(step));
    } catch {}
  }, [restored, step]);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem("juliano_answers", JSON.stringify(answers));
    } catch {}
  }, [answers, restored]);
  const [lead, setLead] = useState({ name: "", email: "", whatsapp: "" });
  const [loadingPct, setLoadingPct] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionId] = useState(() => getSessionId());

  const screen = screens[step] ?? screens[0];
  const totalScreens = screens.length;

  const { currentQuestionNumber, totalQuestions } = useMemo(() => {
    const questions = screens.filter(
      (s) => !["intro", "loading", "lead"].includes(s.type),
    );
    const total = questions.length;
    const index = questions.findIndex((s) => s.id === screen.id);
    return {
      currentQuestionNumber: index >= 0 ? index + 1 : 0,
      totalQuestions: total,
    };
  }, [screen.id]);

  useEffect(() => {
    if (!restored) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [restored, step]);

  useEffect(() => {
    if (!restored) return;
    const s = screens[step];
    if (!s) return;
    const send = () => {
      void supabase
        .from("quiz_events")
        .insert({
          session_id: sessionId,
          screen_id: s.id,
          step_index: step,
        } as never)
        .then(() => {}, () => {});
    };

    const w = typeof window !== "undefined" ? (window as any) : null;
    if (w?.requestIdleCallback) w.requestIdleCallback(send, { timeout: 1500 });
    else setTimeout(send, 0);
  }, [restored, step, sessionId]);

  // Init session once
  useEffect(() => {
    if (!restored || !sessionId) return;
    void initSession(sessionId);
  }, [restored, sessionId]);

  // Click tracking (global, scoped to current screen)
  useEffect(() => {
    if (!restored || !sessionId) return;
    const s = screens[step];
    if (!s) return;
    const handler = (e: MouseEvent) => trackClick(e, sessionId, s.id, step);
    window.addEventListener("click", handler, { capture: true });
    return () => window.removeEventListener("click", handler, { capture: true } as never);
  }, [restored, sessionId, step]);

  // Screen dwell time + scroll depth
  useEffect(() => {
    if (!restored || !sessionId) return;
    const s = screens[step];
    if (!s) return;
    const startedAt = performance.now();
    let maxScroll = 0;
    const onScroll = () => {
      const pageH = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      const visible = window.scrollY + window.innerHeight;
      const pct = (visible / Math.max(1, pageH)) * 100;
      if (pct > maxScroll) maxScroll = pct;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      const duration = performance.now() - startedAt;
      recordScreenTime(sessionId, s.id, step, duration);
      recordScrollDepth(sessionId, s.id, step, maxScroll);
    };
  }, [restored, sessionId, step]);

  const progress = useMemo(
    () => (step / (totalScreens - 1)) * 100,
    [step, totalScreens],
  );

  const next = () => setStep((s) => Math.min(s + 1, totalScreens - 1));
  const back = () => setStep((s) => (s <= 2 ? 0 : s - 1));

  const setAnswer = (id: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: value }));
  };

  // Loading screen progress
  useEffect(() => {
    if (!restored) return;
    if (screen.type !== "loading") return;
    setLoadingPct(0);
    const start = Date.now();
    const duration = 1300;
    const i = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setLoadingPct(pct);
      if (pct >= 100) {
        clearInterval(i);
        setTimeout(() => next(), 300);
      }
    }, 60);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored, screen.id]);

  if (!restored) {
    return <div className="min-h-screen bg-background" />;
  }

  if (analyzing) {
    return (
      <AnalyzingScreen
        onPreload={() => router.preloadRoute({ to: "/resultado" })}
        onDone={() => router.navigate({ to: "/resultado" })}
      />
    );
  }

  if (completed) {
    return (
      <QuizLayout
        progress={100}
        currentStep={totalQuestions}
        totalSteps={totalQuestions}
      >
        <div className="lot-card anim-screen-in rounded-2xl p-8 text-center">
          <span className="paddle mb-3 block">Arrematado</span>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Análise enviada.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Em instantes você vai receber o seu diagnóstico completo e o próximo
            passo para conquistar seu primeiro imóvel ou carro em leilão.
          </p>
        </div>

      </QuizLayout>
    );
  }

  // ---------- INTRO (TELA 1) ----------
  if (screen.type === "intro") {
    const firstQuestion = screens[1];
    const variant = getVariant();
    // Headline fixa (briefing do cliente). Sem sorteio de A/B na copy —
    // getVariant() segue só para atribuição no data-ab-variant.
    const copy = {
      headline: "VOCÊ NÃO TEM MEDO DE LEILÃO. VOCÊ TEM MEDO DE NÃO ENTENDER O QUE ESTÁ ESCRITO NELE.",
      sub_headline:
        "Faça o teste rápido e receba um diagnóstico personalizado dos **bloqueios** que ainda te separam da sua primeira arrematação.",
    };
    void abCopy;
    return (
      <div className="flex min-h-screen flex-col" data-ab-variant={variant}>
        <header className="flex flex-col items-center pt-7">
          <BrandLogo size="lg" priority />
        </header>

        <main className="anim-screen-in mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-7 text-center">
          <h1 className="text-balance font-display text-[1.65rem] font-semibold leading-[1.08] text-foreground sm:text-[2.15rem]">
            {copy.headline}
          </h1>
          <p className="mt-5 max-w-lg text-[0.98rem] leading-relaxed text-muted-foreground">
            {renderBold(copy.sub_headline)}
          </p>

          <div className="mt-9 w-full">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="paddle whitespace-nowrap">Para começar, você é</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {firstQuestion.type === "single" &&
                firstQuestion.options.map((opt, i) => (
                  <OptionCard
                    key={opt.value}
                    index={i}
                    selected={answers[firstQuestion.id] === opt.value}
                    onClick={() => {
                      setAnswer(firstQuestion.id, opt.value);
                      setStep(2);
                    }}
                  >
                    {opt.image ? (
                      <div className="flex w-full flex-col">
                        <div className="aspect-[3/4] w-full overflow-hidden bg-popover/50">
                          <img
                            src={opt.image}
                            alt={opt.label}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="eager"
                            decoding="async"
                          />
                        </div>
                        <span className="px-3 py-3 text-center text-[0.95rem] font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-4">
                        {opt.emoji && <span className="text-2xl leading-none">{opt.emoji}</span>}
                        <span className="text-left text-[0.95rem] font-medium text-foreground">{opt.label}</span>
                      </div>
                    )}
                  </OptionCard>
                ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------- SINGLE ----------
  if (screen.type === "single") {
    const current = answers[screen.id] as string | undefined;
    const cols = screen.grid === 2 ? "grid-cols-2" : "grid-cols-1";
    return (
      <QuizLayout
        progress={progress}
        onBack={back}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      >
        <div key={screen.id} className="anim-screen-in flex min-h-[calc(100vh-11rem)] flex-col justify-center py-2">
          <h2 className="mb-7 text-balance text-center font-display text-[1.35rem] font-semibold leading-[1.15] text-foreground sm:text-[1.7rem]">
            {screen.question}
          </h2>
          <div className={`grid gap-2.5 ${cols}`}>
            {screen.options.map((opt, i) => {
              const selected = current === opt.value;
              return (
                <OptionCard
                  key={opt.value}
                  index={i}
                  selected={selected}
                  showMark={!opt.image}
                  onClick={() => {
                    setAnswer(screen.id, opt.value);
                    setTimeout(next, 320);
                  }}
                >
                  {opt.image ? (
                    <div className="flex w-full flex-col">
                      <div className="aspect-[3/4] w-full overflow-hidden bg-popover/50">
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <span className="px-3 py-3 text-center text-[0.95rem] font-semibold text-foreground">
                        {opt.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 py-4">
                      {opt.emoji && <span className="text-2xl leading-none">{opt.emoji}</span>}
                      <span className="text-left text-[0.95rem] font-medium leading-snug text-foreground">
                        {opt.label}
                      </span>
                    </div>
                  )}
                </OptionCard>
              );
            })}
          </div>
        </div>
      </QuizLayout>
    );
  }

  // ---------- MULTI ----------
  if (screen.type === "multi") {
    const current = (answers[screen.id] as string[]) || [];
    const toggle = (v: string) => {
      const set = new Set(current);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      setAnswer(screen.id, Array.from(set));
    };
    return (
      <QuizLayout
        progress={progress}
        onBack={back}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      >
        <div key={screen.id} className="anim-screen-in">
          <h2 className="mb-2 text-balance text-center font-display text-[1.35rem] font-semibold leading-[1.15] text-foreground sm:text-[1.7rem]">
            {screen.question}
          </h2>
          <p className="paddle mb-5 block text-center">Selecione todas que se aplicam</p>
          <div className="grid gap-2.5">
            {screen.options.map((opt, i) => {
              const selected = current.includes(opt.value);
              return (
                <OptionCard
                  key={opt.value}
                  index={i}
                  selected={selected}
                  showMark
                  onClick={() => toggle(opt.value)}
                >
                  <OptionLabel selected={selected}>{opt.label}</OptionLabel>
                </OptionCard>
              );
            })}
          </div>
          <Button
            className="cta-sheen mt-6 h-13 w-full py-3.5 text-base font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={next}
            disabled={current.length === 0}
          >
            {current.length === 0
              ? "Selecione ao menos uma"
              : `Continuar · ${current.length} ${current.length === 1 ? "selecionada" : "selecionadas"} →`}
          </Button>
        </div>
      </QuizLayout>
    );
  }

  // ---------- SCALE ----------
  if (screen.type === "scale") {
    const current = answers[screen.id] as string | undefined;
    const labels = [
      "Concordo totalmente",
      "Concordo parcialmente",
      "Neutro",
      "Discordo parcialmente",
      "Discordo totalmente",
    ];
    return (
      <QuizLayout
        progress={progress}
        onBack={back}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      >
        <div key={screen.id} className="anim-screen-in">
          <p className="paddle mb-4 block text-center">{screen.question}</p>
          <blockquote className="relative mx-auto mb-7 max-w-md text-center">
            <span aria-hidden="true" className="font-display text-4xl leading-none text-primary/40">“</span>
            <h2 className="-mt-3 text-balance font-display text-[1.3rem] font-medium italic leading-[1.25] text-foreground sm:text-[1.6rem]">
              {screen.statement}
            </h2>
          </blockquote>
          <div className="grid gap-2.5">
            {labels.map((l, i) => {
              const v = String(i);
              const selected = current === v;
              return (
                <OptionCard
                  key={v}
                  index={i}
                  selected={selected}
                  showMark
                  onClick={() => {
                    setAnswer(screen.id, v);
                    setTimeout(next, 320);
                  }}
                >
                  <OptionLabel selected={selected}>{l}</OptionLabel>
                </OptionCard>
              );
            })}
          </div>
        </div>
      </QuizLayout>
    );
  }

  // ---------- CONTENT ----------
  if (screen.type === "content") {
    return (
      <QuizLayout
        progress={progress}
        onBack={back}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      >
        <article key={screen.id} className="lot-card anim-screen-in rounded-2xl p-5 sm:p-7">
          <span className="paddle mb-3 block">
            {screen.quote ? "Quem já arrematou" : "Vale saber"}
          </span>
          <h2 className="text-balance font-display text-[1.3rem] font-semibold leading-[1.2] text-foreground sm:text-[1.6rem]">
            {screen.title}
          </h2>
          {screen.image && (
            <div className="my-4 overflow-hidden rounded-xl border border-border">
              <img src={screen.image} alt="" className="w-full object-contain" loading="lazy" />
            </div>
          )}
          {screen.body && (
            <p className="mt-4 whitespace-pre-line text-[0.98rem] leading-relaxed text-muted-foreground">
              {screen.body}
            </p>
          )}
          {screen.quote && (
            <blockquote className="mt-5 rounded-xl border border-primary/25 bg-primary/[0.07] p-4">
              <p className="text-[0.92rem] italic leading-relaxed text-foreground">
                “{screen.quote.text}”
              </p>
              <footer className="mt-3 flex items-center gap-2 font-mono text-[0.68rem] font-medium uppercase tracking-wider text-secondary">
                <span className="h-px w-5 bg-secondary/50" />
                {screen.quote.author}
              </footer>
            </blockquote>
          )}
          <Button className="cta-sheen mt-6 h-13 w-full py-3.5 text-base font-bold uppercase tracking-wide" onClick={next}>
            Continuar →
          </Button>
        </article>
      </QuizLayout>
    );
  }

  // ---------- DIAGNOSIS ----------
  if (screen.type === "diagnosis") {
    return (
      <DiagnosisScreen
        progress={progress}
        onBack={back}
        onNext={next}
        answers={answers}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      />
    );
  }

  // ---------- COMPARISON ----------
  if (screen.type === "comparison") {
    return (
      <ComparisonScreen
        progress={progress}
        onBack={back}
        onNext={next}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      />
    );
  }

  // ---------- TESTIMONIALS ----------
  if (screen.type === "testimonials") {
    const list = [
      {
        handle: "@joaomp",
        text:
          "mano, em 2 meses no canal eu li 3 movimentos antes de virar notícia. minha família que me zoava agora vem me perguntar o que vai acontecer 😂",
      },
      {
        handle: "@anonimo",
        text:
          "entrei achando q era hype. to la td dia. é o unico lugar q eu posso falar oq penso sem ser tachado de doido",
      },
      {
        handle: "@membro",
        text:
          "o conteudo aqui o instagram NUNCA deixaria postar. simples assim.",
      },
    ];
    return (
      <QuizLayout
        progress={progress}
        onBack={back}
        currentStep={currentQuestionNumber}
        totalSteps={totalQuestions}
      >
        <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
          O que dizem os que já estão dentro:
        </h2>
        <div className="space-y-3">
          {list.map((t) => (
            <div
              key={t.handle}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-sm italic text-foreground">“{t.text}”</p>
              <p className="mt-2 text-xs font-semibold text-primary">
               , {t.handle}
              </p>
            </div>
          ))}
        </div>
        <Button
          className="cta-sheen mt-6 h-13 w-full py-3.5 text-base font-bold uppercase tracking-wide disabled:opacity-50"
          onClick={next}
        >
          Continuar →
        </Button>
      </QuizLayout>
    );
  }

  // ---------- LOADING ----------
  if (screen.type === "loading") {
    const isFinal = screen.id === "loading_final";
    return (
      <QuizLayout progress={progress}>
        <div className="lot-card anim-screen-in rounded-2xl p-8 text-center">
          <span className="paddle mb-3 block">Método · Encontrar → Analisar → Arrematar</span>
          <h2 className="text-balance font-display text-[1.3rem] font-semibold leading-[1.2] text-foreground sm:text-[1.55rem]">
            {isFinal
              ? "Preparando seu plano de ação para a primeira arrematação"
              : "Analisando seus bloqueios com o método"}
          </h2>
          <div className="my-8">
            {!isFinal ? (
              <PremiumChainLoader pct={loadingPct} />
            ) : (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-to-r from-secondary to-primary transition-all" style={{ width: `${loadingPct}%` }} />
                </div>
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-primary">
                  {Math.round(loadingPct)}%
                </p>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {loadingPct < 33
              ? "Identificando as crenças que te travam na hora de arrematar…"
              : loadingPct < 66
              ? "Cruzando suas respostas com o perfil de quem já arrematou…"
              : "Selando o mapa dos bloqueios que precisam ser desfeitos…"}
          </p>
        </div>

      </QuizLayout>
    );
  }

  // ---------- LEAD ----------
  if (screen.type === "lead") {
    const phoneDigits = lead.whatsapp.replace(/\D/g, "");
    const isValidPhone =
      phoneDigits.length === 11 &&
      parseInt(phoneDigits.slice(0, 2), 10) >= 11 &&
      phoneDigits[2] === "9" &&
      !/^(\d)\1+$/.test(phoneDigits.slice(2));
    const formatPhone = (v: string) => {
      const d = v.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : "";
      if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    const valid = lead.name.trim() && lead.email.trim() && isValidPhone;
    return (
      <QuizLayout progress={100} onBack={back}>
        <div className="lot-card anim-screen-in rounded-2xl p-5 sm:p-7">
          <span className="paddle mb-3 block text-center">Lote final · seu diagnóstico</span>
          <h2 className="text-balance text-center font-display text-[1.35rem] font-semibold leading-[1.15] text-foreground sm:text-[1.7rem]">
            Última etapa antes de receber seu diagnóstico.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-[0.92rem] leading-relaxed text-muted-foreground">
            Seu perfil já foi calculado. Informe seus dados para receber o
            diagnóstico personalizado + o próximo passo para a sua primeira arrematação.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (submitting) return;
              if (!valid) {
                if (!lead.name.trim()) toast.error("Informe seu nome.");
                else if (!lead.email.trim()) toast.error("Informe seu e-mail.");
                else if (!isValidPhone) toast.error("WhatsApp inválido. Use (DD) 9XXXX-XXXX.");
                return;
              }
              setSubmitting(true);
              const { score, level } = calculateLevel(answers);
              try {
                sessionStorage.setItem(
                  "juliano_lead",
                  JSON.stringify({
                    name: lead.name.trim(),
                    email: lead.email.trim(),
                    whatsapp: lead.whatsapp.trim(),
                    score,
                    level,
                    answers,
                  }),

                );
              } catch {}
              try {
                const { data: insertedLead, error } = await supabase
                  .from("leads")
                  .insert({
                    name: lead.name.trim(),
                    email: lead.email.trim() || "sem-email@despertar.app",
                    whatsapp: lead.whatsapp.trim() || "—",
                    answers: {
                      ...answers,
                      _score: score,
                      _level: level,
                    },
                    session_id: sessionId,
                  })
                  .select("id")
                  .single();
                if (error) {
                  console.error("[lead insert] falhou:", error);
                } else if (insertedLead?.id) {
                  void linkLeadToSession(sessionId, insertedLead.id);
                }
              } catch (err) {
                console.error("[lead insert] exceção:", err);
              }
              setSubmitting(false);
              setAnalyzing(true);
            }}

          >
            <div>
              <Label htmlFor="name">Primeiro nome</Label>
              <Input
                id="name"
                value={lead.name}
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
                required
                className="mt-1.5 h-12 rounded-xl border-border bg-input/50 focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Como quer ser chamado?"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                required
                className="mt-1.5 h-12 rounded-xl border-border bg-input/50 focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="wa">
                WhatsApp{" "}
                <span className="text-xs text-muted-foreground">
                  (Brasil)
                </span>
              </Label>
              <Input
                id="wa"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={lead.whatsapp}
                onChange={(e) =>
                  setLead({ ...lead, whatsapp: formatPhone(e.target.value) })
                }
                required
                aria-invalid={lead.whatsapp.length > 0 && !isValidPhone}
                className="mt-1.5 h-12 rounded-xl border-border bg-input/50 focus-visible:ring-2 focus-visible:ring-ring"
              />
              {lead.whatsapp.length > 0 && !isValidPhone && (
                <p className="mt-1 text-xs text-destructive">
                  Informe um celular válido com DDD: (11) 9XXXX-XXXX
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!valid || submitting}
              className="cta-sheen h-14 w-full text-base font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando…" : "Receber minha análise completa →"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Seus dados estão seguros e não serão compartilhados
            </p>
          </form>
        </div>

      </QuizLayout>
    );
  }

  return null;
}

// ====================== DIAGNOSIS, 4 níveis de prontidão pra arrematar ======================
const LEVEL_DATA = {
  1: { name: "Baixo", range: "nível 1 de 4", color: "text-destructive", bar: 15 },
  2: { name: "Iniciante", range: "nível 2 de 4", color: "text-destructive", bar: 38 },
  3: { name: "Preparado(a)", range: "nível 3 de 4", color: "text-orange-500", bar: 62 },
  4: { name: "Pronto(a)", range: "nível 4 de 4", color: "text-primary", bar: 85 },
} as const;


function DiagnosisScreen({
  progress,
  onBack,
  onNext,
  answers,
  currentStep,
  totalSteps,
}: {
  progress: number;
  onBack: () => void;
  onNext: () => void;
  answers: Answers;
  currentStep?: number;
  totalSteps?: number;
}) {
  const { score, level } = useMemo(() => calculateLevel(answers), [answers]);
  const data = LEVEL_DATA[level];
  const targetPct = data.bar;

  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPct(0);
    setDone(false);
    const start = Date.now();
    const duration = 2200;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(eased * targetPct);
      if (t >= 1) {
        clearInterval(id);
        setDone(true);
      }
    }, 30);
    return () => clearInterval(id);
  }, [targetPct]);

  const levels = [
    { label: "Baixo", color: "bg-destructive" },
    { label: "Iniciante", color: "bg-destructive/70" },
    { label: "Preparado(a)", color: "bg-orange-500" },
    { label: "Pronto(a)", color: "bg-primary" },
  ];


  return (
    <QuizLayout
      progress={progress}
      onBack={onBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <div className="lot-card anim-screen-in rounded-2xl p-5 sm:p-7">
        <span className="paddle block text-center">Seu diagnóstico · Primeira Arrematação</span>
        <h2 className="mt-2.5 text-center font-display text-[1.9rem] font-semibold leading-none text-foreground sm:text-[2.4rem]">
          Nível <span className={data.color}>{data.name}</span>
        </h2>
        <p className="mt-2.5 text-center font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
          Baixo · Iniciante · Preparado(a) · Pronto(a)
        </p>

        {/* Barra de níveis */}
        <div className="mt-6">
          <div className="relative h-3 w-full overflow-hidden rounded-full">
            <div className="absolute inset-0 flex">
              {levels.map((l) => (
                <div key={l.label} className={`h-full flex-1 ${l.color}`} />
              ))}
            </div>
          </div>
          <div className="relative h-8">
            <div
              className="absolute -top-2 transition-all duration-100 ease-out"
              style={{ left: `calc(${pct}% - 14px)` }}
            >
              <div className="flex flex-col items-center">
                <div className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                  Você
                </div>
                <div className="mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary shadow" />
              </div>
            </div>
          </div>
          <div className="-mt-2 flex justify-between text-[10px] font-semibold text-muted-foreground">
            {levels.map((l) => (
              <span key={l.label} className="flex-1 text-center">
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
          Você ainda não sabe como funciona um leilão real, mas já tem 4 bloqueios ativos que te travam:
        </p>

        <div className="mt-3 space-y-3 text-sm">
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.08] p-3.5">
            <p className="text-xs font-bold uppercase text-destructive">
              🔴 Crença Central
            </p>
            <p className="mt-1 font-bold text-foreground">Medo do Leilão como Ambiente Perigoso</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você foi condicionado(a) a acreditar que leilão é "coisa arriscada", só para advogado ou investidor profissional.
            </p>
          </div>
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.08] p-3.5">
            <p className="text-xs font-bold uppercase text-destructive">
              🔴 Sintoma Emocional
            </p>
            <p className="mt-1 font-bold text-foreground">Sensação de que "não é para mim"</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Toda vez que vê uma oportunidade real, algo por dentro diz: "eu não sou desse mundo, isso é pra gente rica".
            </p>
          </div>
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.08] p-3.5">
            <p className="text-xs font-bold uppercase text-destructive">
              🔴 Conflito Interno
            </p>
            <p className="mt-1 font-bold text-foreground">Medo de perder dinheiro por não entender o processo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você não tem clareza sobre edital, prazos e riscos — então prefere pagar caro no seguro do que aprender o barato.
            </p>
          </div>
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.08] p-3.5">
            <p className="text-xs font-bold uppercase text-destructive">
              🔴 Padrão de Comportamento
            </p>
            <p className="mt-1 font-bold text-foreground">Adiamento e Procrastinação</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você já pensou em estudar sobre leilão várias vezes, mas sempre deixa "para depois, quando tiver mais dinheiro".
            </p>
          </div>
        </div>

      </div>

      <Button
        className="cta-sheen mt-6 h-13 w-full py-3.5 text-base font-bold uppercase tracking-wide disabled:opacity-50"
        onClick={onNext}
        disabled={!done}
      >
        {done ? "Continuar →" : "Analisando..."}
      </Button>
    </QuizLayout>
  );
}

// ====================== COMPARISON ======================
function ComparisonScreen({
  progress,
  onBack,
  onNext,
  currentStep,
  totalSteps,
}: {
  progress: number;
  onBack: () => void;
  onNext: () => void;
  currentStep?: number;
  totalSteps?: number;
}) {
  const rows = [
    { label: "Preço", a: "Paga o valor cheio de mercado ou tabela", b: "Paga de 30% a 60% menos que o valor de mercado" },
    { label: "Segurança", a: "Compra sem entender o edital (risco alto)", b: "Sabe exatamente o que está comprando" },
    { label: "Tempo até conquistar", a: "Pode levar 10+ anos juntando ou financiando", b: "Pode acontecer nos próximos 6 meses" },
    { label: "Método", a: "Tenta sozinho(a), sem direção", b: "Passo a passo: Encontrar → Analisar → Arrematar" },
    { label: "Resultado", a: "Sente que \"não é pra você\"", b: "Primeiro imóvel ou carro conquistado" },
  ];

  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setT(0);
    setDone(false);
    const start = Date.now();
    const duration = 1500;
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / duration);
      setT(1 - Math.pow(1 - k, 3));
      if (k >= 1) {
        clearInterval(id);
        setDone(true);
      }
    }, 30);
    return () => clearInterval(id);
  }, []);

  return (
    <QuizLayout
      progress={progress}
      onBack={onBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <div className="lot-card anim-screen-in rounded-2xl p-5 sm:p-7">
        <h2 className="text-center text-xl font-extrabold text-foreground sm:text-2xl">
          O que muda quando você para de tentar{" "}
          <span className="text-destructive">sozinho(a)</span>:
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center">
            <p className="text-sm font-extrabold text-destructive">
              🔴 Sozinho(a) hoje
            </p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-center">
            <p className="text-sm font-extrabold text-secondary">
              🟢 Você descobrindo como fazer a primeira arrematação
            </p>
          </div>
        </div>


        <div
          className="mt-5 space-y-3"
          style={{ opacity: t, transform: `translateY(${(1 - t) * 8}px)` }}
        >
          {rows.map((r) => (
            <div key={r.label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {r.label}
              </p>
              <div className="mt-1 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                  {r.a}
                </div>
                <div className="rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-secondary">
                  {r.b}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      <Button
        className="cta-sheen mt-6 h-13 w-full py-3.5 text-base font-bold uppercase tracking-wide disabled:opacity-50"
        onClick={onNext}
        disabled={!done}
      >
        {done ? "Continuar →" : "Calculando..."}
      </Button>
    </QuizLayout>
  );
}

// ====================== ANALYZING ======================
function AnalyzingScreen({
  onDone,
  onPreload,
}: {
  onDone: () => void;
  onPreload?: () => void;
}) {
  const steps = [
    "Cruzando suas respostas com o método Primeira Arrematação...",
    "Comparando seu perfil com quem já arrematou seu primeiro imóvel...",
    "Identificando os bloqueios que ainda te separam do primeiro lance...",
    "Mapeando o que precisa ser destravado primeiro...",
    "Selecionando o próximo passo ideal para o seu perfil...",
    "Quase pronto. Preparando seu diagnóstico completo...",
  ];

  const [idx, setIdx] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    onPreload?.();
    const total = 2600;
    const start = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / total) * 100);
      setPct(p);
      setIdx(Math.min(steps.length - 1, Math.floor((p / 100) * steps.length)));
      if (p >= 100) {
        clearInterval(i);
        setTimeout(onDone, 500);
      }
    }, 80);
    return () => {
      clearInterval(i);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pregao-atmos fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center">
      <BrandLogo size="md" className="mb-6 opacity-90" />
      <p className="paddle mb-2">Diagnóstico final · Primeira Arrematação</p>
      <h1 className="mb-3 max-w-md font-display text-[1.7rem] font-semibold leading-tight text-foreground sm:text-3xl">
        Preparando seu plano para a primeira arrematação…
      </h1>

      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Não feche esta página. Sua análise personalizada está sendo finalizada.
      </p>

      <div className="w-full max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-2xl font-extrabold tabular-nums text-primary">
          {Math.round(pct)}%
        </p>
        <p className="mt-3 min-h-[2.5rem] animate-pulse text-sm font-medium text-foreground">
          {steps[idx]}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
        Sua análise está quase pronta…
      </div>
    </div>
  );
}
