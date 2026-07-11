
CREATE TABLE public.ab_variants (
  variant TEXT PRIMARY KEY CHECK (variant IN ('A','B','C','D','E')),
  label TEXT NOT NULL,
  headline TEXT NOT NULL,
  sub_headline TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ab_variants TO anon;
GRANT SELECT, UPDATE ON public.ab_variants TO authenticated;
GRANT ALL ON public.ab_variants TO service_role;

ALTER TABLE public.ab_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variants" ON public.ab_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated can update variants" ON public.ab_variants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ab_variants_updated_at
BEFORE UPDATE ON public.ab_variants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ab_variants (variant, label, headline, sub_headline) VALUES
('A', 'Headline original',
 'Você está realmente acordado ou apenas acha que está?',
 'Faça o teste e descubra em qual dos 4 níveis de consciência você se encontra. No final, você recebe uma análise personalizada do seu nível na **Jornada do Despertar**.'),
('B', '3 minutos / 4 níveis',
 'Descubra em 3 minutos: em qual dos 4 níveis de consciência você está?',
 'Um teste rápido e revelador que mostra onde você está agora — e o que falta para chegar ao **próximo nível**.'),
('C', '9 em cada 10 pessoas',
 '9 em cada 10 pessoas vivem no piloto automático. E você?',
 'Responda 12 perguntas e descubra, sem enrolação, o seu verdadeiro nível de consciência na **Jornada do Despertar**.'),
('D', 'Por que não vive a vida que quer',
 'O teste que revela por que você ainda não está vivendo a vida que quer.',
 'Em menos de 3 minutos você entende exatamente o que está te prendendo — e qual o **próximo passo** para se libertar.'),
('E', 'Qual seu nível de consciência',
 'Qual é o seu nível de consciência hoje? Faça o teste e descubra.',
 'Um diagnóstico honesto, personalizado e gratuito da sua fase atual na **Jornada do Despertar**.');
