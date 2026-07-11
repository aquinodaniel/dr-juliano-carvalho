import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { screens, type Screen } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { HeatmapPicker } from "@/components/admin/Heatmap";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Juliano Carvalho" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  answers: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
};

type QuizEvent = {
  session_id: string;
  screen_id: string;
  step_index: number;
  created_at: string;
  lead_id?: string | null;
};

type SessionRow = {
  session_id: string;
  lead_id: string | null;
  device_type: string | null;
  user_agent: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  started_at: string;
  last_seen_at: string;
  completed: boolean;
  variant: string | null;
};

type ClickRow = {
  session_id: string;
  screen_id: string;
  rel_x: number;
  rel_y: number;
  viewport_width: number;
  viewport_height: number;
  element_tag: string | null;
  element_text: string | null;
  created_at: string;
};

type ScreenTimeRow = {
  session_id: string;
  screen_id: string;
  step_index: number;
  duration_ms: number;
};

type ScrollRow = {
  session_id: string;
  screen_id: string;
  max_scroll_pct: number;
};

const ALLOWED_ADMIN_EMAILS = ["joemelloca@gmail.com", "admin@plx.com"];
const ALLOWED_ADMIN_EMAIL = "joemelloca@gmail.com";

function renderVariantBold(text: string) {
  const parts = (text ?? "").split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <span key={i} className="text-primary font-semibold">{p.slice(2, -2)}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!session) return <LoginForm />;
  if (!ALLOWED_ADMIN_EMAILS.includes(session.user.email ?? "")) {
    supabase.auth.signOut();
    return <LoginForm />;
  }
  return <Dashboard onLogout={() => supabase.auth.signOut()} />;
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/admin`,
        extraParams: { prompt: "select_account", login_hint: ALLOWED_ADMIN_EMAIL },
      });
      if (result.error) {
        toast.error("Falha ao entrar com Google.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (!ALLOWED_ADMIN_EMAILS.includes(data.user?.email ?? "")) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito ao administrador autorizado.");
      }
    } catch {
      toast.error("Erro ao entrar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const attempt = async () =>
        supabase.auth.signInWithPassword({ email: email.trim(), password });

      let { error } = await attempt();

      // Bootstrap the admin@plx.com user on first login if it doesn't exist yet.
      if (error && email.trim().toLowerCase() === "admin@plx.com") {
        try {
          const { ensureAdminUser } = await import("@/lib/admin-bootstrap.functions");
          await ensureAdminUser();
          ({ error } = await attempt());
        } catch {
          // fall through to error toast
        }
      }

      if (error) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!ALLOWED_ADMIN_EMAILS.includes(data.user?.email ?? "")) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito ao administrador autorizado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold">Admin Juliano Carvalho</h1>
        <p className="text-sm text-muted-foreground">Acesso restrito.</p>
        <form onSubmit={signInWithPassword} className="space-y-3">
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "..." : "Entrar"}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>
        <Button variant="outline" onClick={signInWithGoogle} disabled={loading} className="w-full">
          {loading ? "..." : "Entrar com Google"}
        </Button>
      </div>
    </div>
  );
}

type Tab = "overview" | "heatmap" | "leads" | "sessions";
type DateRange = "today" | "yesterday" | "7d" | "21d" | "31d" | "all";

const RANGE_LABELS: Record<DateRange, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7d": "7 dias",
  "21d": "21 dias",
  "31d": "31 dias",
  all: "Tudo",
};

function rangeStart(r: DateRange): Date | null {
  const now = new Date();
  if (r === "all") return null;
  if (r === "today") {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
  }
  if (r === "yesterday") {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1); return d;
  }
  const days = r === "7d" ? 7 : r === "21d" ? 21 : 31;
  const d = new Date(now); d.setDate(d.getDate() - days); return d;
}

function rangeEnd(r: DateRange): Date | null {
  if (r !== "yesterday") return null;
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function inRange(iso: string | null | undefined, start: Date | null, end: Date | null): boolean {
  if (!start) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (t < start.getTime()) return false;
  if (end && t >= end.getTime()) return false;
  return true;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<DateRange>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [utmFilter, setUtmFilter] = useState<string>("all");
  const [leadsAll, setLeadsAll] = useState<Lead[]>([]);
  const [eventsAll, setEventsAll] = useState<QuizEvent[]>([]);
  const [sessionsAll, setSessionsAll] = useState<SessionRow[]>([]);
  const [clicksAll, setClicksAll] = useState<ClickRow[]>([]);
  const [screenTimesAll, setScreenTimesAll] = useState<ScreenTimeRow[]>([]);
  const [scrollsAll, setScrollsAll] = useState<ScrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [previewScreen, setPreviewScreen] = useState<Screen | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [variants, setVariants] = useState<Array<{ variant: string; label: string; headline: string; sub_headline: string }>>([]);
  const [savingVariant, setSavingVariant] = useState<string | null>(null);

  const loadVariants = async () => {
    const { data } = await supabase.from("ab_variants" as never).select("*").order("variant");
    setVariants((data as never) ?? []);
  };
  useEffect(() => { void loadVariants(); }, []);

  const saveVariant = async (v: { variant: string; label: string; headline: string; sub_headline: string }) => {
    setSavingVariant(v.variant);
    const { data, error } = await supabase
      .from("ab_variants" as never)
      .update({ label: v.label, headline: v.headline, sub_headline: v.sub_headline } as never)
      .eq("variant", v.variant)
      .select();
    setSavingVariant(null);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    if (!data || (data as unknown[]).length === 0) {
      toast.error("Nada foi salvo. Faça login como admin (sem permissão para atualizar).");
      return;
    }
    toast.success(`Variante ${v.variant} salva com sucesso`, { description: v.headline });
    void loadVariants();
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [l, e, s, c, st, sc] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("quiz_events").select("session_id,screen_id,step_index,created_at,lead_id"),
        supabase.from("quiz_sessions" as never).select("*").order("started_at", { ascending: false }),
        supabase.from("quiz_clicks" as never).select("*"),
        supabase.from("quiz_screen_time" as never).select("*"),
        supabase.from("quiz_scroll_depth" as never).select("*"),
      ]);
      setLeadsAll((l.data as Lead[]) ?? []);
      setEventsAll((e.data as QuizEvent[]) ?? []);
      setSessionsAll((s.data as SessionRow[]) ?? []);
      setClicksAll((c.data as ClickRow[]) ?? []);
      setScreenTimesAll((st.data as ScreenTimeRow[]) ?? []);
      setScrollsAll((sc.data as ScrollRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const { leads, events, sessions, clicks, screenTimes, scrolls } = useMemo(() => {
    const start = rangeStart(range);
    const end = rangeEnd(range);
    const filteredSessions = sessionsAll.filter((s) => {
      if (!inRange(s.started_at, start, end)) return false;
      if (deviceFilter !== "all" && (s.device_type || "unknown") !== deviceFilter) return false;
      if (utmFilter !== "all" && (s.utm_source || "(direto)") !== utmFilter) return false;
      return true;
    });
    const sessionIds = new Set(filteredSessions.map((s) => s.session_id));
    const leadIds = new Set(filteredSessions.map((s) => s.lead_id).filter(Boolean) as string[]);
    const hasSessionFilter = deviceFilter !== "all" || utmFilter !== "all";
    return {
      leads: leadsAll.filter((l) => {
        if (!inRange(l.created_at, start, end)) return false;
        if (hasSessionFilter) return leadIds.has(l.id) || (l.session_id ? sessionIds.has(l.session_id) : false);
        return true;
      }),
      events: eventsAll.filter((e) => inRange(e.created_at, start, end) && (!hasSessionFilter || sessionIds.has(e.session_id))),
      sessions: filteredSessions,
      clicks: clicksAll.filter((c) => inRange(c.created_at, start, end) && (!hasSessionFilter || sessionIds.has(c.session_id))),
      screenTimes: (start || hasSessionFilter) ? screenTimesAll.filter((s) => sessionIds.has(s.session_id)) : screenTimesAll,
      scrolls: (start || hasSessionFilter) ? scrollsAll.filter((s) => sessionIds.has(s.session_id)) : scrollsAll,
    };
  }, [range, deviceFilter, utmFilter, leadsAll, eventsAll, sessionsAll, clicksAll, screenTimesAll, scrollsAll]);


  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.whatsapp?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const funnel = useMemo(() => {
    const reachByScreen = new Map<string, Set<string>>();
    for (const ev of events) {
      if (!reachByScreen.has(ev.screen_id)) reachByScreen.set(ev.screen_id, new Set());
      reachByScreen.get(ev.screen_id)?.add(ev.session_id);
    }
    const allSessionsCount = sessions.length || new Set(events.map((e) => e.session_id)).size;
    const firstId = screens[0]?.id;
    const totalStarts = firstId ? reachByScreen.get(firstId)?.size || 0 : 0;
    const totalBase = Math.max(allSessionsCount, totalStarts, leads.length);

    const steps = screens.map((s, idx) => {
      const reached = reachByScreen.get(s.id)?.size || 0;
      const actual = s.type === "lead" ? Math.max(reached, leads.length) : reached;
      return {
        index: idx,
        id: s.id,
        type: s.type,
        label: ["single", "multi", "scale"].includes(s.type) ? `Pergunta ${idx}` : s.id,
        reached: actual,
        pct: totalBase ? (actual / totalBase) * 100 : 0,
      };
    });
    return { steps, totalBase };
  }, [events, leads, sessions]);

  const stats = useMemo(() => {
    const total = funnel.totalBase;
    const completions = leads.length;
    const abandonments = Math.max(0, total - completions);
    const convRate = total ? (completions / total) * 100 : 0;
    return { total, completions, abandonments, convRate };
  }, [funnel, leads]);

  const abStats = useMemo(() => {
    const variants: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];
    const introId = screens[0]?.id;
    const startedSet = new Set(
      events.filter((e) => e.step_index >= 1).map((e) => e.session_id),
    );
    // sessões que clicaram em algum botão de checkout (venda / intenção de compra)
    const salesSet = new Set(
      events
        .filter((e) => typeof e.screen_id === "string" && e.screen_id.startsWith("checkout_click_"))
        .map((e) => e.session_id),
    );
    return variants.map((v) => {
      const vSessions = sessions.filter((s) => (s.variant || "").toUpperCase() === v);
      const sessionIds = new Set(vSessions.map((s) => s.session_id));
      const leadsCount = vSessions.filter((s) => s.lead_id).length
        || leads.filter((l) => l.session_id && sessionIds.has(l.session_id)).length;
      const completions = vSessions.filter((s) => s.completed).length;
      const total = vSessions.length;
      const started = vSessions.filter((s) => startedSet.has(s.session_id)).length;
      const salesCount = vSessions.filter((s) => salesSet.has(s.session_id)).length;
      const entryRate = total ? (started / total) * 100 : 0;
      const convRate = total ? (leadsCount / total) * 100 : 0;
      const salesRate = total ? (salesCount / total) * 100 : 0;
      const completionRate = total ? (completions / total) * 100 : 0;
      const introTimes = screenTimes.filter(
        (st) => st.screen_id === introId && sessionIds.has(st.session_id),
      );
      const avgIntroMs = introTimes.length
        ? introTimes.reduce((a, b) => a + b.duration_ms, 0) / introTimes.length
        : 0;
      return { variant: v, total, leadsCount, completions, started, salesCount, entryRate, convRate, salesRate, completionRate, avgIntroMs };
    });
  }, [sessions, leads, screenTimes, events]);



  const screenTimeStats = useMemo(() => {
    const byScreen = new Map<string, number[]>();
    for (const st of screenTimes) {
      if (!byScreen.has(st.screen_id)) byScreen.set(st.screen_id, []);
      byScreen.get(st.screen_id)?.push(st.duration_ms);
    }
    return screens
      .map((s, idx) => {
        const arr = byScreen.get(s.id) || [];
        const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const med = arr.length ? [...arr].sort((a, b) => a - b)[Math.floor(arr.length / 2)] : 0;
        return { idx, id: s.id, samples: arr.length, avgMs: avg, medianMs: med };
      })
      .filter((r) => r.samples > 0);
  }, [screenTimes]);

  const scrollStats = useMemo(() => {
    const byScreen = new Map<string, number[]>();
    for (const sc of scrolls) {
      if (!byScreen.has(sc.screen_id)) byScreen.set(sc.screen_id, []);
      byScreen.get(sc.screen_id)?.push(sc.max_scroll_pct);
    }
    return screens
      .map((s, idx) => {
        const arr = byScreen.get(s.id) || [];
        const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        return { idx, id: s.id, samples: arr.length, avgPct: avg };
      })
      .filter((r) => r.samples > 0);
  }, [scrolls]);

  const deviceBreakdown = useMemo(() => {
    const c = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    for (const s of sessions) {
      const t = (s.device_type as keyof typeof c) || "unknown";
      if (t in c) c[t]++;
      else c.unknown++;
    }
    return c;
  }, [sessions]);

  const utmBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const src = s.utm_source || "(direto)";
      map.set(src, (map.get(src) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const deviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessionsAll) set.add(s.device_type || "unknown");
    return Array.from(set).sort();
  }, [sessionsAll]);

  const utmOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessionsAll) set.add(s.utm_source || "(direto)");
    return Array.from(set).sort();
  }, [sessionsAll]);

  const timeSeries = useMemo(() => {
    const start = rangeStart(range);
    const end = rangeEnd(range) ?? new Date();
    const from = start ?? (sessionsAll.length
      ? new Date(Math.min(...sessionsAll.map((s) => new Date(s.started_at).getTime())))
      : new Date(end.getTime() - 7 * 86400000));
    const fromDay = new Date(from); fromDay.setHours(0, 0, 0, 0);
    const toDay = new Date(end); toDay.setHours(0, 0, 0, 0);
    const days: { key: string; label: string; sessions: number; leads: number; clicks: number }[] = [];
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    for (let d = new Date(fromDay); d.getTime() <= toDay.getTime(); d.setDate(d.getDate() + 1)) {
      days.push({ key: dayKey(d), label: `${d.getDate()}/${d.getMonth() + 1}`, sessions: 0, leads: 0, clicks: 0 });
    }
    if (days.length === 0) return days;
    const idx = new Map(days.map((d, i) => [d.key, i]));
    for (const s of sessions) {
      const i = idx.get(dayKey(new Date(s.started_at)));
      if (i !== undefined) days[i].sessions++;
    }
    for (const l of leads) {
      const i = idx.get(dayKey(new Date(l.created_at)));
      if (i !== undefined) days[i].leads++;
    }
    for (const c of clicks) {
      const i = idx.get(dayKey(new Date(c.created_at)));
      if (i !== undefined) days[i].clicks++;
    }
    return days;
  }, [range, sessions, leads, clicks, sessionsAll]);



  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Juliano Carvalho</h1>
          <Button variant="outline" onClick={onLogout}>Sair</Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setExportOpen((o) => !o)}>
              Exportar ▾
            </Button>
            {exportOpen && (
              <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-lg border bg-popover shadow-lg">
                {(["csv", "json", "xlsx"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setExportOpen(false);
                      exportData(fmt, { leads, sessions, events, clicks, screenTimes, scrolls }, range);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {fmt === "csv" ? "CSV (leads)" : fmt === "json" ? "JSON (tudo)" : "Planilha XLSX (tudo)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Device
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-foreground"
            >
              <option value="all">Todos</option>
              {deviceOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Origem
            <select
              value={utmFilter}
              onChange={(e) => setUtmFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-foreground"
            >
              <option value="all">Todas</option>
              {utmOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          {(deviceFilter !== "all" || utmFilter !== "all") && (
            <button
              onClick={() => { setDeviceFilter("all"); setUtmFilter("all"); }}
              className="text-xs text-primary underline"
            >
              Limpar filtros
            </button>
          )}
        </div>


        <nav className="flex flex-wrap gap-2 border-b">
          {([
            ["overview", "Visão geral"],
            ["heatmap", "Mapa de calor"],
            ["sessions", "Sessões"],
            ["leads", "Leads"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium ${
                tab === key ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {loading && <p className="text-muted-foreground">Carregando dados...</p>}

        {!loading && tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Sessões" value={stats.total} />
              <Stat label="Leads" value={stats.completions} />
              <Stat label="Abandonos" value={stats.abandonments} />
              <Stat label="Conversão" value={`${stats.convRate.toFixed(1)}%`} />
            </div>

            <TimeSeriesChart data={timeSeries} />

            <section className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Teste A/B — Página inicial (5 variantes)</h2>
                <span className="text-xs text-muted-foreground">
                  Split 20/20/20/20/20 · Force com <code>?variant=A</code>…<code>E</code>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {abStats.map((s) => {
                  const best = abStats.reduce((a, b) => (b.salesCount > a.salesCount && b.total > 0 ? b : a), abStats[0]);
                  const winning = s.variant === best.variant && s.total > 0 && s.salesCount > 0;
                  const labels: Record<string, string> = Object.fromEntries(
                    variants.map((v) => [v.variant, v.label]),
                  );
                  return (
                    <div
                      key={s.variant}
                      className={`rounded-xl border p-4 ${winning ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold">
                          Variante {s.variant}
                          {winning && <span className="ml-2 text-xs font-medium text-primary">▲ vencendo</span>}
                        </h3>
                        <span className="text-[10px] text-muted-foreground text-right max-w-[55%]">
                          {labels[s.variant]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Visitantes</div>
                          <div className="text-xl font-bold tabular-nums">{s.total}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Leads</div>
                          <div className="text-xl font-bold tabular-nums">{s.leadsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Vendas</div>
                          <div className="text-xl font-bold tabular-nums text-primary">{s.salesCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Taxa de venda</div>
                          <div className="text-xl font-bold tabular-nums text-primary">{s.salesRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Conversão (lead)</div>
                          <div className="text-lg font-semibold tabular-nums">{s.convRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Conclusão</div>
                          <div className="text-lg font-semibold tabular-nums">{s.completionRate.toFixed(1)}%</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground">Tempo médio na intro</div>
                          <div className="text-lg font-semibold tabular-nums">
                            {(s.avgIntroMs / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Comparativo por headline</h2>
                <p className="text-xs text-muted-foreground">
                  Taxa de entrada no funil (avançou da tela inicial) vs. taxa de conversão (virou lead), por variante.
                </p>
              </div>
              <ABComparisonChart
                data={abStats.map((s) => ({
                  variant: s.variant,
                  label: variants.find((v) => v.variant === s.variant)?.label ?? "",
                  headline: variants.find((v) => v.variant === s.variant)?.headline ?? "",
                  total: s.total,
                  started: s.started,
                  leads: s.leadsCount,
                  entryRate: s.entryRate,
                  convRate: s.convRate,
                }))}
              />
            </section>



            <section className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Editar textos das variantes</h2>
                <p className="text-xs text-muted-foreground">
                  Trechos entre <code>**palavras**</code> viram destaque colorido na página.
                </p>
              </div>
              <div className="space-y-4">
                {variants.map((v, idx) => (
                  <div key={v.variant} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                        Variante {v.variant}
                      </span>
                      <Input
                        value={v.label}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...v, label: e.target.value };
                          setVariants(next);
                        }}
                        placeholder="Rótulo curto"
                        className="max-w-xs"
                      />
                    </div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Headline</label>
                    <Input
                      value={v.headline}
                      onChange={(e) => {
                        const next = [...variants];
                        next[idx] = { ...v, headline: e.target.value };
                        setVariants(next);
                      }}
                      className="mb-3"
                    />
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Sub-headline</label>
                    <textarea
                      value={v.sub_headline}
                      onChange={(e) => {
                        const next = [...variants];
                        next[idx] = { ...v, sub_headline: e.target.value };
                        setVariants(next);
                      }}
                      rows={3}
                      className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <div className="mb-3 rounded-lg border border-dashed border-border bg-background p-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Preview
                      </p>
                      <h3 className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                        {v.headline || <span className="text-muted-foreground italic">(headline vazia)</span>}
                      </h3>
                      <p className="mt-3 text-base text-muted-foreground">
                        {renderVariantBold(v.sub_headline)}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => saveVariant(v)}
                        disabled={savingVariant === v.variant}
                      >
                        {savingVariant === v.variant ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">Carregando variantes...</p>
                )}
              </div>
            </section>




            <section className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Funil</h2>
              <div className="space-y-2">
                {funnel.steps.map((f, i) => {
                  const prev = i > 0 ? funnel.steps[i - 1].reached : f.reached;
                  const drop = prev > 0 ? ((prev - f.reached) / prev) * 100 : 0;
                  const dropAbs = Math.max(0, prev - f.reached);
                  const keep = prev > 0 ? (f.reached / prev) * 100 : 100;
                  return (
                    <button
                      key={f.id + i}
                      onClick={() => setPreviewScreen(screens[f.index])}
                      className="w-full space-y-1 rounded-lg p-2 text-left transition hover:bg-muted/50"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {i + 1}. {f.label}{" "}
                          <span className="text-xs uppercase text-muted-foreground">({f.type})</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {f.reached} ({f.pct.toFixed(1)}% do total)
                          {i > 0 && (
                            <span className="ml-2 text-primary">{keep.toFixed(1)}% da anterior</span>
                          )}
                          {i > 0 && dropAbs > 0 && (
                            <span className="ml-2 text-destructive">−{dropAbs} saíram ({drop.toFixed(1)}%)</span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${f.pct}%` }} />
                      </div>
                    </button>
                  );
                })}

              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="rounded-2xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Tempo médio por tela</h2>
                {screenTimeStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {screenTimeStats.map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span className="truncate">{r.idx + 1}. {r.id}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {(r.avgMs / 1000).toFixed(1)}s · mediana {(r.medianMs / 1000).toFixed(1)}s · n={r.samples}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Scroll médio por tela</h2>
                {scrollStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {scrollStats.map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span className="truncate">{r.idx + 1}. {r.id}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {r.avgPct.toFixed(0)}% · n={r.samples}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Dispositivos</h2>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between"><span>📱 Mobile</span><span className="tabular-nums">{deviceBreakdown.mobile}</span></li>
                  <li className="flex justify-between"><span>💻 Desktop</span><span className="tabular-nums">{deviceBreakdown.desktop}</span></li>
                  <li className="flex justify-between"><span>📲 Tablet</span><span className="tabular-nums">{deviceBreakdown.tablet}</span></li>
                  <li className="flex justify-between"><span>❓ Outros</span><span className="tabular-nums">{deviceBreakdown.unknown}</span></li>
                </ul>
              </section>

              <section className="rounded-2xl bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Origem (UTM source)</h2>
                {utmBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {utmBreakdown.map(([src, n]) => (
                      <li key={src} className="flex justify-between">
                        <span className="truncate">{src}</span>
                        <span className="tabular-nums">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {!loading && tab === "heatmap" && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Mapa de calor — cliques por tela</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Coordenadas normalizadas (independente do dispositivo). Quanto mais quente, mais cliques no ponto.
            </p>
            <HeatmapPicker allClicks={clicks} />
          </section>
        )}

        {!loading && tab === "sessions" && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sessões ({sessions.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4">Início</th>
                    <th className="py-2 pr-4">Device</th>
                    <th className="py-2 pr-4">Origem</th>
                    <th className="py-2 pr-4">Convertido</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.session_id} className="border-b">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(s.started_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-4">{s.device_type || "—"}</td>
                      <td className="py-2 pr-4">{s.utm_source || s.referrer || "direto"}</td>
                      <td className="py-2 pr-4">{s.lead_id ? "✅" : "—"}</td>
                      <td className="py-2">
                        <button className="text-primary underline" onClick={() => setSelectedSession(s)}>
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sem sessões.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "leads" && (
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Leads ({filteredLeads.length})</h2>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">WhatsApp</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-4">{l.name}</td>
                      <td className="py-2 pr-4">{l.email}</td>
                      <td className="py-2 pr-4">{l.whatsapp}</td>
                      <td className="py-2">
                        <button className="text-primary underline" onClick={() => setSelected(l)}>
                          Ver respostas
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum lead.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.name}>
          <p className="text-sm text-muted-foreground">{selected.email} · {selected.whatsapp}</p>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs">
            {JSON.stringify(selected.answers, null, 2)}
          </pre>
        </Modal>
      )}

      {selectedSession && (
        <Modal onClose={() => setSelectedSession(null)} title={`Sessão ${selectedSession.session_id.slice(0, 8)}`}>
          <SessionDetail
            session={selectedSession}
            events={events.filter((e) => e.session_id === selectedSession.session_id)}
            screenTimes={screenTimes.filter((s) => s.session_id === selectedSession.session_id)}
            clicks={clicks.filter((c) => c.session_id === selectedSession.session_id)}
            leads={leads}
          />
        </Modal>
      )}

      {previewScreen && (
        <Modal
          onClose={() => setPreviewScreen(null)}
          title={`Etapa #${screens.findIndex((s) => s.id === previewScreen.id) + 1}`}
        >
          <ScreenPreview screen={previewScreen} />
        </Modal>
      )}
    </div>
  );
}

function SessionDetail({
  session,
  events,
  screenTimes,
  clicks,
  leads,
}: {
  session: SessionRow;
  events: QuizEvent[];
  screenTimes: ScreenTimeRow[];
  clicks: ClickRow[];
  leads: Lead[];
}) {
  const lead = leads.find((l) => l.id === session.lead_id);
  const totalTime = screenTimes.reduce((a, b) => a + b.duration_ms, 0);
  const journey = [...events].sort((a, b) => a.step_index - b.step_index);
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Info label="Device" value={session.device_type || "—"} />
        <Info label="Viewport" value={`${session.viewport_width}×${session.viewport_height}`} />
        <Info label="UTM Source" value={session.utm_source || "—"} />
        <Info label="UTM Campaign" value={session.utm_campaign || "—"} />
        <Info label="Referrer" value={session.referrer || "direto"} />
        <Info label="Tempo total" value={`${(totalTime / 1000).toFixed(1)}s`} />
        <Info label="Cliques" value={String(clicks.length)} />
        <Info label="Telas vistas" value={String(events.length)} />
      </div>
      {lead && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="font-semibold">{lead.name}</p>
          <p className="text-xs text-muted-foreground">{lead.email} · {lead.whatsapp}</p>
        </div>
      )}
      <div>
        <p className="mb-2 font-semibold">Jornada</p>
        <ol className="space-y-1 text-xs">
          {journey.map((e, i) => {
            const t = screenTimes.find((s) => s.screen_id === e.screen_id);
            return (
              <li key={i} className="flex justify-between rounded bg-muted px-2 py-1">
                <span>{e.step_index}. {e.screen_id}</span>
                <span className="tabular-nums text-muted-foreground">
                  {t ? `${(t.duration_ms / 1000).toFixed(1)}s` : "—"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {clicks.length > 0 && (
        <div>
          <p className="mb-2 font-semibold">Cliques</p>
          <ul className="space-y-1 text-xs">
            {clicks.slice(0, 30).map((c, i) => (
              <li key={i} className="rounded bg-muted px-2 py-1">
                <span className="text-muted-foreground">{c.screen_id}</span>{" "}
                · <span>{c.element_tag}</span>{" "}
                {c.element_text && <span className="italic">"{c.element_text.slice(0, 40)}"</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">User Agent: <span className="break-all">{session.user_agent}</span></p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted px-2 py-1">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type ExportPayload = {
  leads: Lead[];
  sessions: SessionRow[];
  events: QuizEvent[];
  clicks: ClickRow[];
  screenTimes: ScreenTimeRow[];
  scrolls: ScrollRow[];
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportData(format: "csv" | "json" | "xlsx", data: ExportPayload, range: DateRange) {
  const stamp = `${range}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "csv") {
    const headers = ["Nome", "Email", "Telefone", "Data", "Respostas"];
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = data.leads.map((l) =>
      [l.name, l.email, l.whatsapp, new Date(l.created_at).toLocaleString("pt-BR"), JSON.stringify(l.answers)]
        .map(escape)
        .join(","),
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `leads-despertar-${stamp}.csv`);
    return;
  }
  if (format === "json") {
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `despertar-${stamp}.json`,
    );
    return;
  }
  // xlsx — dynamic import to keep main bundle slim
  void import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.leads.map((l) => ({
          nome: l.name,
          email: l.email,
          whatsapp: l.whatsapp,
          data: new Date(l.created_at).toLocaleString("pt-BR"),
          respostas: JSON.stringify(l.answers),
        })),
      ),
      "Leads",
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.sessions), "Sessões");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.events), "Eventos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.clicks), "Cliques");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.screenTimes), "TempoTela");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.scrolls), "Scroll");
    XLSX.writeFile(wb, `despertar-${stamp}.xlsx`);
  });
}

function ScreenPreview({ screen }: { screen: Screen }) {
  if (screen.type === "single" || screen.type === "multi") {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold">{screen.question}</p>
        <ul className="space-y-2">
          {screen.options.map((o) => (
            <li key={o.value} className="rounded-lg border bg-background p-3 text-sm">{o.label}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (screen.type === "scale") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{screen.question}</p>
        <p className="text-base font-semibold italic">"{screen.statement}"</p>
      </div>
    );
  }
  if (screen.type === "content") {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold">{screen.title}</p>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{screen.body}</p>
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Tela: {screen.type}</p>;
}

type SeriesPoint = { key: string; label: string; sessions: number; leads: number; clicks: number };

function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  if (data.length === 0) {
    return null;
  }
  const W = 720;
  const H = 200;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxY = Math.max(1, ...data.flatMap((d) => [d.sessions, d.leads, d.clicks]));
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const xAt = (i: number) => pad.l + i * step;
  const yAt = (v: number) => pad.t + innerH - (v / maxY) * innerH;
  const path = (key: "sessions" | "leads" | "clicks") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(d[key]).toFixed(1)}`).join(" ");

  const ticks = 4;
  const labelEvery = Math.max(1, Math.ceil(data.length / 10));

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Atividade por dia</h2>
        <div className="flex gap-3 text-xs">
          <LegendDot color="hsl(var(--primary))" label="Sessões" />
          <LegendDot color="#10b981" label="Leads" />
          <LegendDot color="#f59e0b" label="Cliques" />
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full min-w-[480px]">
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const y = pad.t + (innerH / ticks) * i;
            const v = Math.round(maxY - (maxY / ticks) * i);
            return (
              <g key={i}>
                <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="currentColor" className="text-muted" strokeWidth={0.5} />
                <text x={pad.l - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                  {v}
                </text>
              </g>
            );
          })}
          <path d={path("sessions")} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
          <path d={path("leads")} fill="none" stroke="#10b981" strokeWidth={2} />
          <path d={path("clicks")} fill="none" stroke="#f59e0b" strokeWidth={2} />
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text
                key={d.key}
                x={xAt(i)}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

type ABRow = {
  variant: string;
  label: string;
  headline: string;
  total: number;
  started: number;
  leads: number;
  entryRate: number;
  convRate: number;
};

function ABComparisonChart({ data }: { data: ABRow[] }) {
  const maxPct = Math.max(100, ...data.map((d) => Math.max(d.entryRate, d.convRate)));
  const bestEntry = data.reduce((a, b) => (b.entryRate > a.entryRate ? b : a), data[0]);
  const bestConv = data.reduce((a, b) => (b.convRate > a.convRate ? b : a), data[0]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs">
        <LegendDot color="hsl(var(--primary))" label="Entrada no funil" />
        <LegendDot color="hsl(var(--muted-foreground))" label="Conversão em lead" />
      </div>
      <div className="space-y-3">
        {data.map((d) => {
          const entryW = maxPct ? (d.entryRate / maxPct) * 100 : 0;
          const convW = maxPct ? (d.convRate / maxPct) * 100 : 0;
          const isBestEntry = d.variant === bestEntry?.variant && d.entryRate > 0;
          const isBestConv = d.variant === bestConv?.variant && d.convRate > 0;
          return (
            <div key={d.variant} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="mr-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {d.variant}
                  </span>
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {d.total} visitantes · {d.started} iniciaram · {d.leads} leads
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-muted-foreground">Entrada</span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-primary transition-all"
                      style={{ width: `${entryW}%` }}
                    />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-xs tabular-nums ${isBestEntry ? "font-bold text-primary" : ""}`}>
                    {d.entryRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-muted-foreground">Conversão</span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-muted-foreground/60 transition-all"
                      style={{ width: `${convW}%` }}
                    />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-xs tabular-nums ${isBestConv ? "font-bold text-foreground" : ""}`}>
                    {d.convRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {data.every((d) => d.total === 0) && (
          <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
        )}
      </div>
    </div>
  );
}

