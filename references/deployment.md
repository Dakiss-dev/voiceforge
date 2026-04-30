# Deployment

This guide covers deploying the VoiceForge reference template to Cloudflare Workers. Phase 2 will add Vercel, Node, and Bun guides.

## Prerequisites

- Cloudflare account (free): https://dash.cloudflare.com/sign-up
- Wrangler CLI installed (it's a dev dependency in `templates/app/`)

## First deploy

From your scaffolded app directory:

```bash
npm install
npx wrangler login   # one-time, opens browser to authenticate
```

### Set secrets

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID
# Paste value when prompted

npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_PHONE_NUMBER
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Deploy

```bash
npm run deploy
```

Output ends with the deployed URL:

```
https://voiceforge-app.<your-subdomain>.workers.dev
```

### Verify

```bash
curl https://voiceforge-app.<your-subdomain>.workers.dev/health
# expect: ok
```

### Connect Twilio

In the Twilio Console, point your number's voice webhook to:

- `https://voiceforge-app.<your-subdomain>.workers.dev/voice` (POST)
- `https://voiceforge-app.<your-subdomain>.workers.dev/voice/status` (POST)

Save. Call the number. The receptionist answers.

## Updating

After code changes:

```bash
npm run deploy
```

That's it. New version goes live in seconds.

## Custom domain

Cloudflare Workers can run on your own domain:

1. Add your domain to Cloudflare DNS
2. Workers → your worker → Triggers → Custom Domains → Add
3. Enter `voice.yourdomain.com`
4. Cloudflare adds the DNS record + SSL automatically

Then update Twilio webhook to `https://voice.yourdomain.com/voice`.

## Logs

Tail logs in real time:

```bash
npm run tail
```

Or in the dashboard: Workers → your worker → Logs.

## Multi-environment (staging vs production)

Add to `wrangler.toml`:

```toml
[env.staging]
name = "voiceforge-app-staging"
vars = { DEFAULT_LANGUAGE = "fr" }

[env.production]
name = "voiceforge-app-production"
vars = { DEFAULT_LANGUAGE = "fr" }
```

Deploy each:

```bash
npx wrangler deploy --env staging
npx wrangler deploy --env production
```

Set secrets per environment:

```bash
npx wrangler secret put TWILIO_AUTH_TOKEN --env staging
```

## Cost

Cloudflare Workers free tier:
- 100,000 requests/day
- 10ms CPU per request

A receptionist call generates ~5-10 requests (one per turn). Free tier handles ~10,000 calls/day.

For higher volume: $5/mo Workers Paid plan = 10M requests + longer CPU limits.

## Troubleshooting

**`npm run deploy` fails with auth error:** Run `npx wrangler login` again.

**Worker deploys but webhook returns 500:** Check `npm run tail` for the actual error. Most common: missing secret. Verify all `wrangler secret list`.

**`fetch is not defined`:** You're missing `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`, or `compatibility_date` is too old. Set both per the template.

**Cold start latency:** Workers have ~5ms cold starts at the edge. If you see 200ms+ on first calls, the bottleneck is Anthropic API or Supabase, not Workers.
