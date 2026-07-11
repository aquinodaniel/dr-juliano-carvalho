
-- Sessions
CREATE TABLE public.quiz_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  user_agent text,
  device_type text,
  viewport_width integer,
  viewport_height integer,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  completed boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE ON public.quiz_sessions TO anon, authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can upsert sessions" ON public.quiz_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update own session" ON public.quiz_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can view sessions" ON public.quiz_sessions FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_quiz_sessions_session_id ON public.quiz_sessions(session_id);
CREATE INDEX idx_quiz_sessions_lead_id ON public.quiz_sessions(lead_id);

-- Clicks
CREATE TABLE public.quiz_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  screen_id text NOT NULL,
  step_index integer NOT NULL DEFAULT 0,
  x integer NOT NULL,
  y integer NOT NULL,
  rel_x numeric NOT NULL,
  rel_y numeric NOT NULL,
  viewport_width integer NOT NULL,
  viewport_height integer NOT NULL,
  element_tag text,
  element_text text,
  element_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_clicks TO anon, authenticated;
GRANT ALL ON public.quiz_clicks TO service_role;
ALTER TABLE public.quiz_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert clicks" ON public.quiz_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view clicks" ON public.quiz_clicks FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_quiz_clicks_screen ON public.quiz_clicks(screen_id);
CREATE INDEX idx_quiz_clicks_session ON public.quiz_clicks(session_id);

-- Screen time
CREATE TABLE public.quiz_screen_time (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  screen_id text NOT NULL,
  step_index integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_screen_time TO anon, authenticated;
GRANT ALL ON public.quiz_screen_time TO service_role;
ALTER TABLE public.quiz_screen_time ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert screen time" ON public.quiz_screen_time FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view screen time" ON public.quiz_screen_time FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_quiz_screen_time_screen ON public.quiz_screen_time(screen_id);
CREATE INDEX idx_quiz_screen_time_session ON public.quiz_screen_time(session_id);

-- Scroll depth
CREATE TABLE public.quiz_scroll_depth (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  screen_id text NOT NULL,
  step_index integer NOT NULL DEFAULT 0,
  max_scroll_pct integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_scroll_depth TO anon, authenticated;
GRANT ALL ON public.quiz_scroll_depth TO service_role;
ALTER TABLE public.quiz_scroll_depth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert scroll" ON public.quiz_scroll_depth FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view scroll" ON public.quiz_scroll_depth FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_quiz_scroll_screen ON public.quiz_scroll_depth(screen_id);

-- Link lead to quiz events too
ALTER TABLE public.quiz_events ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
