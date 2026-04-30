-- VoiceForge canonical schema (Phase 1)
-- Run this in your Supabase SQL editor or via the Supabase CLI.

create table if not exists calls (
  id text primary key,
  twilio_call_sid text unique not null,
  caller_number text not null,
  business_number text not null default '',
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer,
  status text default 'in_progress',
  language text default 'fr',
  metadata jsonb default '{}'::jsonb
);

create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id text references calls(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  ts timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  call_id text references calls(id) on delete set null,
  name text,
  phone text,
  email text,
  intent text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_calls_started_at on calls(started_at desc);
create index if not exists idx_transcripts_call_id on transcripts(call_id);
create index if not exists idx_transcripts_ts on transcripts(ts);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_call_id on leads(call_id);
