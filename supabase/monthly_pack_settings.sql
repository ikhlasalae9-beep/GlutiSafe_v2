alter table public.pack_settings
  add column if not exists monthly_reset_hours int default 24,
  add column if not exists monthly_ai_messages_limit int default 100;

update public.pack_settings
set
  monthly_reset_hours = coalesce(monthly_reset_hours, 24),
  monthly_ai_messages_limit = coalesce(monthly_ai_messages_limit, 100);

alter table public.pack_settings
  drop constraint if exists pack_settings_monthly_reset_hours_check;

alter table public.pack_settings
  add constraint pack_settings_monthly_reset_hours_check
  check (monthly_reset_hours in (24, 168));
