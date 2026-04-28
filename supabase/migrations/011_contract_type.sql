-- Add contract_type column to distinguish service agreements from NDAs/non-competes
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'service_agreement';
