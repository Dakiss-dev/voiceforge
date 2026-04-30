# Supabase Storage Adapter

**Status:** Phase 1, in progress

Implements: `StorageProvider` from `core/interfaces.ts`.

Supabase is the reference storage-provider adapter. Persists calls, transcripts, and leads.

## Will support (Phase 1)

- `saveCall` → `calls` table insert/update
- `saveTranscript` → `transcripts` table insert
- `saveLead` → `leads` table insert
- `getCall` → query by call ID

## Schema

See `templates/supabase/migrations/0001_calls_schema.sql` for the canonical schema. Run it via `scripts/setup-supabase.mjs` during init.

## Required environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side writes; never expose this to a client)

## Links

- Supabase docs: https://supabase.com/docs
- JavaScript client: https://supabase.com/docs/reference/javascript/introduction
- Pricing: https://supabase.com/pricing
