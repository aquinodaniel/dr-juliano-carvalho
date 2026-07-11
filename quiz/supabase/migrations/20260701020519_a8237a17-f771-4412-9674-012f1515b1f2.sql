
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) > 0
  AND position('@' in email) > 1
  AND length(regexp_replace(whatsapp, '[^0-9]', '', 'g')) >= 10
);
