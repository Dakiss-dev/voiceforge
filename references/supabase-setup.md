# Supabase Setup

## Create a project

1. Sign up: https://supabase.com
2. New project → pick a region close to your Worker (e.g. `us-east-1` for North American callers)
3. Set a strong database password (save it in your password manager)

## Get credentials

Project Settings → API:

- **Project URL** → `SUPABASE_URL`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **NEVER expose the service_role key to client code.** It bypasses Row Level Security. Use it only in your Cloudflare Worker (server-side).

## Run the schema migration

Project → SQL Editor → New query. Paste the SQL from:

```
templates/supabase/migrations/0001_calls_schema.sql
```

Run it. You should see:
- `calls` table
- `transcripts` table
- `leads` table
- 4 indexes

## Verify

In Table Editor, you should see all three tables empty. Once your receptionist takes a call, rows will appear.

## (Optional) Enable Row Level Security

For Phase 1, the receptionist Worker is the only writer. RLS isn't required since you're using the service_role key. If you later expose this data to a client (e.g., a dashboard for the business owner), enable RLS:

```sql
alter table calls enable row level security;
alter table transcripts enable row level security;
alter table leads enable row level security;

-- Then add policies that scope rows by business_id, owner_id, or however you key tenancy.
```

Phase 2 will include a multi-tenant policy template.

## Pricing

- Free tier: 500 MB database, 5 GB bandwidth, generous compute
- Pro: $25/mo for production loads

A receptionist storing call logs and transcripts uses very little storage. Free tier comfortably handles 10K+ calls.

## Troubleshooting

**`permission denied for table calls`:** You're using the anon key instead of the service_role key. Swap to service_role.

**`relation "calls" does not exist`:** Migration didn't run. Re-execute the SQL in the SQL editor.

**Slow queries:** Add indexes. The default migration includes indexes on `started_at`, `call_id`, `phone`. If you query by other columns, add more.

**Free tier paused:** Free Supabase projects pause after 7 days of inactivity. Send a request or upgrade if your receptionist is dormant.
