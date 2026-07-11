import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import beforeMan from "@/assets/before-man.jpg.asset.json";
import afterMan from "@/assets/after-man.jpg.asset.json";
import beforeWoman from "@/assets/before-woman.jpg.asset.json";
import afterWoman from "@/assets/after-woman.jpg.asset.json";
import julianoPhoto from "@/assets/juliano-carvalho.jpg.asset.json";

export const Route = createFileRoute("/resultado")({
  head: () => ({
    meta: [
      { title: "Seu resultado — Imersão Primeira Arrematação" },
      {
        name: "description",
        content:
          "Diagnóstico personalizado do seu perfil para arrematar imóveis e carros em leilão com o método de Juliano Carvalho.",
      },
    ],
  }),
  component: ResultadoPage,
});

const CHECKOUT_URL = "https://payfast.greenn.com.br/bcw3h86/offer/mn7Ir9";

function buildCheckoutUrl(): string {
  if (typeof window === "undefined") return CHECKOUT_URL;
  const url = new URL(CHECKOUT_URL);
  const current = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
    const fromUrl = current.get(k);
    if (fromUrl) sessionStorage.setItem(k, fromUrl);
    const v = fromUrl || sessionStorage.getItem(k);
    if (v) url.searchParams.set(k, v);
  });
  try {
    const lead = JSON.parse(sessionStorage.getItem("juliano_lead") || "{}");
    if (lead?.email) url.searchParams.set("email", lead.email);
    if (lead?.name) url.searchParams.set("name", lead.name);
    if (lead?.whatsapp) url.searchParams.set("phone", lead.whatsapp);
  } catch {
    // ignore
  }
  return url.toString();
}

// Contagem regressiva HONESTA até o início do evento (26/07, 20h BRT).
// Sem timer de 10 min que reseta — a urgência é a data real.
const EVENT_START = "2026-07-26T20:00:00-03:00";
function useCountdown() {
  const target = useMemo(() => new Date(EVENT_START).getTime(), []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target - now);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    over: diff === 0,
    d: Math.floor(diff / 86400000),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  };
}

const TESTIMONIALS = [
  {
    name: "Rafael S.",
    msg: "Arrematei meu primeiro apartamento com 52% de desconto do valor de mercado. O passo a passo do edital foi o que me deu segurança pra dar o lance.",
  },
  {
    name: "Camila R.",
    msg: "Achava que leilão era só pra advogado ou investidor. Em poucas semanas entendi o processo e hoje já analiso edital sozinha, sem medo.",
  },
  {
    name: "Fernanda M.",
    msg: "Comprei meu carro pagando quase metade do preço de tabela, sem financiar nada. Método simples, direto e sem enrolação.",
  },
  {
    name: "Marcos T.",
    msg: "Depois de anos pagando aluguel, finalmente conquistei meu imóvel próprio. O diferencial foi aprender a ler o edital antes de qualquer lance.",
  },
];

function ResultadoPage() {
  const timer = useCountdown();

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("juliano_session_id");
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void supabase
      .from("quiz_events")
      .insert({
        session_id: sessionId,
        screen_id: "resultado_view",
        step_index: 999,
      })
      .then(() => {}, () => {});
  }, [sessionId]);

  const trackCheckout = (plan: string) => {
    if (!sessionId) return;
    void supabase
      .from("quiz_events")
      .insert({
        session_id: sessionId,
        screen_id: `checkout_click_${plan}`,
        step_index: 1000,
      })
      .then(() => {}, () => {});
  };

  const lead = useMemo(() => {
    if (typeof window === "undefined")
      return { name: "", score: 0, level: "" };
    try {
      const raw = sessionStorage.getItem("juliano_lead");
      if (!raw) return { name: "", score: 0, level: "" };
      const p = JSON.parse(raw) as { name?: string; score?: number; level?: string };
      return {
        name: (p.name || "").trim().split(" ")[0] || "",
        score: p.score || 0,
        level: p.level || "",
      };
    } catch {
      return { name: "", score: 0, level: "" };
    }
  }, []);

  const firstName = lead.name
    ? lead.name.charAt(0).toUpperCase() + lead.name.slice(1).toLowerCase()
    : "";

  const gender = useMemo(() => {
    if (typeof window === "undefined") return "homem";
    try {
      const raw = sessionStorage.getItem("juliano_answers");
      if (!raw) return "homem";
      const a = JSON.parse(raw) as { genero?: string };
      return a.genero === "mulher" ? "mulher" : "homem";
    } catch {
      return "homem";
    }
  }, []);

  const beforeUrl = gender === "mulher" ? beforeWoman.url : beforeMan.url;
  const afterUrl = gender === "mulher" ? afterWoman.url : afterMan.url;

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-primary/20 bg-primary/10 py-2 text-center font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-secondary sm:text-xs">
        {timer.over
          ? "O ao vivo já começou · garanta seu acesso"
          : `Faltam ${timer.d}d ${timer.h}h ${timer.m}m ${timer.s}s para o ao vivo`}
      </div>

      <header className="border-b border-border bg-background/95 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4">
          <BrandLogo size="md" />
        </div>
      </header>

      <section className="px-4 pt-10 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Seu resultado está pronto
          </p>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
            📅 26, 27 e 28 de julho · Online e ao vivo
          </div>
          <h1
            style={{ fontSize: "clamp(1.6rem, 6vw, 2.6rem)" }}
            className="mt-4 text-balance font-semibold uppercase leading-tight text-foreground"
          >
            {firstName ? `${firstName}, ` : ""}você está pronto(a) para dar o seu primeiro lance com segurança.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Em apenas 3 dias, descubra como qualquer brasileiro pode conquistar o primeiro imóvel
            ou o primeiro carro pagando muito menos do que imagina — através dos leilões. Sem ser
            advogado, sem ser rico e sem "contato" nenhum.
          </p>

          <a
            href={buildCheckoutUrl()}
            onClick={() => trackCheckout("hero")}
            className="cta-sheen mt-8 inline-block w-full max-w-md rounded-2xl bg-gradient-to-b from-secondary to-primary px-6 py-5 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-[0_15px_40px_-10px_rgba(176,138,62,0.6)] transition-transform hover:scale-[1.02] sm:text-lg"
          >
            Garantir minha vaga por R$ 19
          </a>
          <p className="mt-3 text-sm text-muted-foreground">🔒 Pagamento 100% seguro · Acesso imediato</p>
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold uppercase text-foreground sm:text-3xl">
            De sonhar com a casa própria a <span className="text-primary">arrematar até 50% mais barato</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
            A diferença entre continuar pagando aluguel e conquistar o seu imóvel está em saber como participar de um leilão com segurança.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-destructive/40 bg-card">
              <div className="relative">
                <img
                  src={beforeUrl}
                  alt="Antes — pagando aluguel e financiamento"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="aspect-square w-full object-cover grayscale"
                />
                <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase text-destructive-foreground">
                  Antes
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-foreground">Preso ao aluguel e ao financiamento</p>
                <p className="mt-1 text-xs text-muted-foreground">Pagando o valor cheio, sem enxergar saída.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-primary/50 bg-card shadow-[0_10px_40px_-10px_rgba(176,138,62,0.4)]">
              <div className="relative">
                <img
                  src={afterUrl}
                  alt="Depois — arrematou a casa própria em leilão"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                  Depois
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-primary/95 px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                  -50%
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-foreground">Casa própria arrematada</p>
                <p className="mt-1 text-xs text-muted-foreground">Pagando até 50% menos que o valor de mercado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-primary">
            O que você vai aprender
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Leilão não é sorte nem coisa de rico. É um caminho que <span className="italic text-primary">se aprende.</span>
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Encontrar",
                d: "Onde estão os leilões de imóvel e carro de verdade, como ler um edital sem se perder e separar a oportunidade real da furada.",
              },
              {
                n: "02",
                t: "Analisar",
                d: "O passo que evita 90% das dores de cabeça: entender o que está escrito antes de dar o lance e saber se o desconto compensa.",
              },
              {
                n: "03",
                t: "Arrematar",
                d: "Como dar o lance com confiança, quanto você precisa pra começar e o caminho até o bem ficar no seu nome.",
              },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-background p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-sm font-bold text-primary">
                  {step.n}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{step.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-primary">
            A pessoa por trás do método
          </p>
          <h2 className="mt-3 text-center text-2xl font-semibold text-foreground sm:text-3xl">
            O <span className="italic text-primary">especialista</span> por trás da metodologia
          </h2>

          <div className="mt-10 grid grid-cols-1 items-center gap-8 md:grid-cols-[280px_1fr]">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="overflow-hidden rounded-2xl border border-primary/40 shadow-[0_15px_40px_-10px_rgba(176,138,62,0.35)]">
                <img
                  src={julianoPhoto.url}
                  alt="Juliano Carvalho"
                  width={560}
                  height={720}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Juliano Carvalho · Alphaville/SP
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Antes de ser investidor, fui advogado corporativo por mais de <strong className="text-foreground">17 anos</strong>. Meu trabalho era um só: ler o que estava escrito, enxergar o risco que ninguém via e proteger quem confiava em mim.
              </p>
              <p>
                Foi aí que entendi uma coisa que mudou minha vida: <mark className="rounded bg-primary/20 px-1 text-foreground">o leilão não assusta quem sabe ler o que está no papel.</mark> O que parece "perigoso" pra maioria, pra mim era território conhecido: edital, processo, letra miúda.
              </p>
              <p>
                Comecei a aplicar isso por conta própria e, nos últimos anos, já arrematei <strong className="text-foreground">mais de R$ 25 milhões em imóveis</strong>. Não por sorte, nem por contato — por método.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
                <div>
                  <p className="text-2xl font-semibold text-primary sm:text-3xl">17</p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">anos como advogado corporativo</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-primary sm:text-3xl">+R$25mi</p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">arrematados em imóveis, por método</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-primary sm:text-3xl">milhares</p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">de contratos analisados antes de decidir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>





      <section className="border-y border-border bg-card/40 px-5 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold uppercase text-foreground sm:text-3xl">
            Quem já aplicou o método:
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm leading-relaxed text-foreground">{t.msg}</p>
                <p className="mt-3 text-right text-xs text-primary">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto max-w-xl text-center">
          <a
            href={buildCheckoutUrl()}
            onClick={() => trackCheckout("final")}
            className="cta-sheen inline-block w-full rounded-2xl bg-gradient-to-b from-secondary to-primary px-6 py-5 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-[0_15px_40px_-10px_rgba(176,138,62,0.6)] transition-transform hover:scale-[1.02] sm:text-lg"
          >
            Quero minha primeira arrematação
          </a>
          <p className="mt-4 text-sm text-muted-foreground">🔒 Pagamento 100% seguro</p>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-5 py-8 text-center text-xs leading-relaxed text-muted-foreground">
        <p className="mx-auto max-w-2xl">
          A Imersão Primeira Arrematação é um treinamento de educação sobre leilões. O conteúdo é
          informativo e não constitui promessa de retorno financeiro; resultados dependem de cada
          participante.
        </p>
        <p className="mt-4">
          © {new Date().getFullYear()} Juliano Carvalho · 26, 27 e 28 de julho · Online e ao vivo · R$ 19
        </p>
      </footer>
    </div>
  );
}
