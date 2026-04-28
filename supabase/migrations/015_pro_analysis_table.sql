-- Pro-only analysis fields moved to a separate table.
-- RLS ensures free users cannot read their own rows here.

CREATE TABLE public.contract_analysis_pro (
  contract_id UUID PRIMARY KEY REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged_clauses JSONB NOT NULL DEFAULT '[]',
  missing_protections JSONB NOT NULL DEFAULT '[]',
  positive_notes JSONB NOT NULL DEFAULT '[]',
  negotiation_priority JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contract_analysis_pro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro analysis — own rows, pro plan only" ON public.contract_analysis_pro
  FOR ALL USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

-- Migrate existing pro fields out of contracts.analysis
INSERT INTO public.contract_analysis_pro (contract_id, user_id, flagged_clauses, missing_protections, positive_notes, negotiation_priority)
SELECT
  c.id,
  c.user_id,
  COALESCE(c.analysis->'flagged_clauses', '[]'::jsonb),
  COALESCE(c.analysis->'missing_protections', '[]'::jsonb),
  COALESCE(c.analysis->'positive_notes', '[]'::jsonb),
  COALESCE(c.analysis->'negotiation_priority', '[]'::jsonb)
FROM public.contracts c
WHERE c.status = 'analyzed' AND c.analysis IS NOT NULL
ON CONFLICT (contract_id) DO NOTHING;

-- Strip pro fields from contracts.analysis — base fields only remain
UPDATE public.contracts
SET analysis = analysis - 'flagged_clauses' - 'missing_protections' - 'positive_notes' - 'negotiation_priority'
WHERE status = 'analyzed' AND analysis IS NOT NULL;
