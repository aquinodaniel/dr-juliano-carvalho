-- 1) Add session_token column
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS session_token TEXT;

-- 2) Remove direct UPDATE access for anon/authenticated
DROP POLICY IF EXISTS "Anon can update unlinked session" ON public.quiz_sessions;
REVOKE UPDATE ON public.quiz_sessions FROM anon, authenticated;

-- 3) Secure RPC: heartbeat
CREATE OR REPLACE FUNCTION public.touch_quiz_session(p_session_id TEXT, p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quiz_sessions
     SET last_seen_at = now()
   WHERE session_id = p_session_id
     AND session_token IS NOT NULL
     AND session_token = p_token;
END;
$$;

-- 4) Secure RPC: link lead to session
CREATE OR REPLACE FUNCTION public.link_quiz_session_lead(
  p_session_id TEXT,
  p_token TEXT,
  p_lead_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quiz_sessions
     SET lead_id = p_lead_id,
         completed = true,
         last_seen_at = now()
   WHERE session_id = p_session_id
     AND session_token IS NOT NULL
     AND session_token = p_token
     AND lead_id IS NULL;

  UPDATE public.quiz_events
     SET lead_id = p_lead_id
   WHERE session_id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_quiz_session(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_quiz_session_lead(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_quiz_session(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_quiz_session_lead(TEXT, TEXT, UUID) TO anon, authenticated;