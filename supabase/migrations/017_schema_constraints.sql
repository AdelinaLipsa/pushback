-- H-01: plan column CHECK — only 'free' and 'pro' are valid values
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('free', 'pro'));

-- H-02: contracts risk_level CHECK — NULL allowed (pre-analysis rows)
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_risk_level_check
  CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- H-02: contracts status CHECK
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('pending', 'analyzed', 'error'));

-- H-02: reply_threads risk_signal CHECK
ALTER TABLE public.reply_threads
  ADD CONSTRAINT reply_threads_risk_signal_check
  CHECK (risk_signal IN ('backing_down', 'doubling_down', 'escalating', 'unclear'));
