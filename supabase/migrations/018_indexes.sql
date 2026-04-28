-- H-08: invoice.paid webhook looks up user by stripe_subscription_id — needs index
CREATE INDEX IF NOT EXISTS user_profiles_stripe_subscription_id_idx
  ON public.user_profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- M-09: dashboard joins projects → defense_responses via project_id
CREATE INDEX IF NOT EXISTS defense_responses_project_id_idx
  ON public.defense_responses (project_id);

-- M-10: RLS policies filter every query on user_id — must be indexed
CREATE INDEX IF NOT EXISTS contracts_user_id_idx
  ON public.contracts (user_id);

CREATE INDEX IF NOT EXISTS defense_responses_user_id_idx
  ON public.defense_responses (user_id);

CREATE INDEX IF NOT EXISTS projects_user_id_idx
  ON public.projects (user_id);

CREATE INDEX IF NOT EXISTS reply_threads_user_id_idx
  ON public.reply_threads (user_id);

CREATE INDEX IF NOT EXISTS feedback_user_id_idx
  ON public.feedback (user_id);
