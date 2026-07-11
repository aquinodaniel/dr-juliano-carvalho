-- quiz_sessions UPDATE: tighten WITH CHECK
DROP POLICY IF EXISTS "Anon can update unlinked session" ON public.quiz_sessions;
CREATE POLICY "Anon can update unlinked session"
ON public.quiz_sessions FOR UPDATE TO anon, authenticated
USING (lead_id IS NULL)
WITH CHECK (session_id IS NOT NULL);

-- quiz_sessions INSERT
DROP POLICY IF EXISTS "Anyone can upsert sessions" ON public.quiz_sessions;
CREATE POLICY "Anyone can insert sessions"
ON public.quiz_sessions FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL);

-- quiz_clicks INSERT
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.quiz_clicks;
CREATE POLICY "Anyone can insert clicks"
ON public.quiz_clicks FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND screen_id IS NOT NULL);

-- quiz_events INSERT
DROP POLICY IF EXISTS "Anyone can insert quiz events" ON public.quiz_events;
CREATE POLICY "Anyone can insert quiz events"
ON public.quiz_events FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL);

-- quiz_screen_time INSERT
DROP POLICY IF EXISTS "Anyone can insert screen time" ON public.quiz_screen_time;
CREATE POLICY "Anyone can insert screen time"
ON public.quiz_screen_time FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND screen_id IS NOT NULL);

-- quiz_scroll_depth INSERT
DROP POLICY IF EXISTS "Anyone can insert scroll" ON public.quiz_scroll_depth;
CREATE POLICY "Anyone can insert scroll"
ON public.quiz_scroll_depth FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND screen_id IS NOT NULL);