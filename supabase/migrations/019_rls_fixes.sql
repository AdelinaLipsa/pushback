-- H-03: feedback DELETE policy — allows account-level self-service deletion
CREATE POLICY "Users can delete own feedback"
  ON public.feedback FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- M-03: reply_threads IDOR — tighten WITH CHECK to verify defense_response ownership.
-- Current FOR ALL policy has no WITH CHECK, so a user could insert a reply_thread
-- referencing another user's defense_response_id.
DROP POLICY IF EXISTS "Own reply threads only" ON public.reply_threads;

CREATE POLICY "Own reply threads only" ON public.reply_threads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.defense_responses
      WHERE id = defense_response_id AND user_id = auth.uid()
    )
  );

-- M-04: contract_analysis_pro — split FOR ALL into separate SELECT (plan-gated) and
-- INSERT/UPDATE (own rows only, plan enforcement at application layer).
-- The old FOR ALL USING clause applied to WITH CHECK too, blocking direct inserts for
-- everyone including pro users. Admin writes bypass RLS; this is just for correctness.
DROP POLICY IF EXISTS "Pro analysis — own rows, pro plan only" ON public.contract_analysis_pro;

CREATE POLICY "Pro analysis — select" ON public.contract_analysis_pro
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "Pro analysis — write" ON public.contract_analysis_pro
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pro analysis — update" ON public.contract_analysis_pro
  FOR UPDATE USING (auth.uid() = user_id);
