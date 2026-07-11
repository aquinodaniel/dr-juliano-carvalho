import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "juliano_session_id";
const TOKEN_KEY = "juliano_session_token";
const VARIANT_KEY = "juliano_variant";

export type Variant = "A" | "B" | "C" | "D" | "E";
const VARIANTS: Variant[] = ["A", "B", "C", "D", "E"];

export function getVariant(): Variant {
  if (typeof window === "undefined") return "A";
  const forced = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
  if (forced && (VARIANTS as string[]).includes(forced)) {
    sessionStorage.setItem(VARIANT_KEY, forced);
    return forced as Variant;
  }
  const saved = sessionStorage.getItem(VARIANT_KEY);
  if (saved && (VARIANTS as string[]).includes(saved)) return saved as Variant;
  const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  sessionStorage.setItem(VARIANT_KEY, v);
  return v;
}


function randomToken(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint8Array(24);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) return saved;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  const saved = sessionStorage.getItem(TOKEN_KEY);
  if (saved) return saved;
  const t = randomToken();
  sessionStorage.setItem(TOKEN_KEY, t);
  return t;
}

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

let sessionInitialized = false;

export async function initSession(sessionId: string) {
  if (typeof window === "undefined" || sessionInitialized || !sessionId) return;
  sessionInitialized = true;
  const ua = navigator.userAgent;
  const params = new URLSearchParams(window.location.search);
  const token = getSessionToken();
  try {
    await supabase.from("quiz_sessions" as never).insert({
      session_id: sessionId,
      session_token: token,
      user_agent: ua,
      device_type: detectDevice(ua),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      variant: getVariant(),
    } as never);
  } catch {
    // session already exists — ignore
  }
}

export async function touchSession(sessionId: string) {
  if (!sessionId) return;
  const token = getSessionToken();
  try {
    await supabase.rpc("touch_quiz_session" as never, {
      p_session_id: sessionId,
      p_token: token,
    } as never);
  } catch {}
}

export async function linkLeadToSession(sessionId: string, leadId: string) {
  if (!sessionId || !leadId) return;
  const token = getSessionToken();
  try {
    await supabase.rpc("link_quiz_session_lead" as never, {
      p_session_id: sessionId,
      p_token: token,
      p_lead_id: leadId,
    } as never);
  } catch {}
}

export function trackClick(
  e: MouseEvent,
  sessionId: string,
  screenId: string,
  stepIndex: number,
) {
  if (!sessionId || !screenId) return;
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const clickable = target.closest("button, a, [role='button'], label, input");
  const el = (clickable as HTMLElement) || target;
  const text = (el.innerText || el.getAttribute("aria-label") || "")
    .trim()
    .slice(0, 120);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = Math.round(e.clientX);
  const y = Math.round(e.clientY + window.scrollY);
  const pageH = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  );
  void supabase
    .from("quiz_clicks" as never)
    .insert({
      session_id: sessionId,
      screen_id: screenId,
      step_index: stepIndex,
      x,
      y,
      rel_x: Number((x / Math.max(1, w)).toFixed(4)),
      rel_y: Number((y / Math.max(1, pageH)).toFixed(4)),
      viewport_width: w,
      viewport_height: h,
      element_tag: el.tagName?.toLowerCase() ?? null,
      element_text: text || null,
      element_id: el.id || null,
    } as never)
    .then(() => {}, () => {});
}

export function recordScreenTime(
  sessionId: string,
  screenId: string,
  stepIndex: number,
  durationMs: number,
) {
  if (!sessionId || !screenId || durationMs < 200) return;
  void supabase
    .from("quiz_screen_time" as never)
    .insert({
      session_id: sessionId,
      screen_id: screenId,
      step_index: stepIndex,
      duration_ms: Math.round(durationMs),
    } as never)
    .then(() => {}, () => {});
}

export function recordScrollDepth(
  sessionId: string,
  screenId: string,
  stepIndex: number,
  maxScrollPct: number,
) {
  if (!sessionId || !screenId) return;
  void supabase
    .from("quiz_scroll_depth" as never)
    .insert({
      session_id: sessionId,
      screen_id: screenId,
      step_index: stepIndex,
      max_scroll_pct: Math.min(100, Math.max(0, Math.round(maxScrollPct))),
    } as never)
    .then(() => {}, () => {});
}

