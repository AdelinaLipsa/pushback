ALTER TABLE public.projects
  ADD COLUMN payment_due_date date,
  ADD COLUMN payment_amount numeric,
  ADD COLUMN payment_received_at timestamptz;
