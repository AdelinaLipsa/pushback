-- Add project_id to contracts so the relationship is queryable from both ends.
-- The existing link runs projects.contract_id → contracts; this adds the reverse.

alter table public.contracts
  add column project_id uuid references public.projects(id) on delete set null;

-- Backfill: derive project_id from the existing projects.contract_id link
update public.contracts c
set project_id = p.id
from public.projects p
where p.contract_id = c.id;

create index contracts_project_id_idx on public.contracts(project_id);
