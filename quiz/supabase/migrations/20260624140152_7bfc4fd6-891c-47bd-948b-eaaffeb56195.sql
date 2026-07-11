DROP POLICY IF EXISTS "Anyone can update own session" ON public.quiz_sessions;

CREATE POLICY "Anon can update unlinked session"
ON public.quiz_sessions
FOR UPDATE
TO anon, authenticated
USING (lead_id IS NULL)
WITH CHECK (true);