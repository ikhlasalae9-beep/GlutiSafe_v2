alter table public.pack_settings
  add column if not exists yearly_reset_hours integer not null default 168,
  add column if not exists yearly_ai_messages_limit integer not null default 500;

update public.pack_settings
set
  yearly_reset_hours = coalesce(yearly_reset_hours, 168),
  yearly_ai_messages_limit = coalesce(yearly_ai_messages_limit, 500);

alter table public.pack_settings
  drop constraint if exists pack_settings_yearly_reset_hours_check;

alter table public.pack_settings
  add constraint pack_settings_yearly_reset_hours_check
  check (yearly_reset_hours in (168, 720));
