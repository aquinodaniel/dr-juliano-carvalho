DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(name)) > 0
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(regexp_replace(whatsapp, '\D', '', 'g')) >= 10
);