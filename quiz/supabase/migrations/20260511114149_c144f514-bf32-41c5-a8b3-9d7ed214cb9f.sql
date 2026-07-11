
-- Add session_id to leads to correlate with quiz progress
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id uuid;

-- Quiz event tracking table
CREATE TABLE IF NOT EXISTS public.quiz_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL,
  screen_id text NOT NULL,
  step_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_events_session ON public.quiz_events(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_screen ON public.quiz_events(screen_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_created ON public.quiz_events(created_at DESC);

ALTER TABLE public.quiz_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz events"
ON public.quiz_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can view quiz events"
ON public.quiz_events FOR SELECT
TO authenticated
USING (true);
