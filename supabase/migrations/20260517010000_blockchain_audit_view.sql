-- Create audit-safe view without user_id for blockchain transparency
create or replace view public.blockchain_records_audit as
select
  id,
  target_type,
  target_id,
  event_type,
  external_transaction_id,
  external_hash,
  external_status,
  block_index,
  block_hash,
  merkle_root,
  nonce,
  mined_at,
  is_audited,
  audit_status,
  error_message,
  created_at,
  updated_at
from public.blockchain_records
order by created_at desc;

-- Grant select permission to authenticated users
grant select on table public.blockchain_records_audit to authenticated;
