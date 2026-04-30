# VoiceForge App

This is your AI receptionist, scaffolded by VoiceForge. It runs on Cloudflare Workers, uses Twilio for the phone layer, Claude for reasoning, and Supabase for storage.

## What's wired

- **Phone:** Twilio Programmable Voice with `<Gather input="speech">` for built-in STT
- **TTS:** Twilio's Polly Neural voices via `<Say>` (no separate TTS API call)
- **LLM:** Anthropic Claude (default `claude-sonnet-4-5`)
- **Storage:** Supabase (`calls`, `transcripts`, `leads` tables)
- **Runtime:** Cloudflare Workers

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the Supabase migration

In your Supabase SQL editor, run the SQL from `voiceforge/templates/supabase/migrations/0001_calls_schema.sql`. This creates the `calls`, `transcripts`, and `leads` tables.

### 3. Configure environment

Copy `.env.example` to `.dev.vars` (Wrangler reads this for local dev):

```bash
cp .env.example .dev.vars
```

Fill in your real values.

### 4. Local dev

```bash
npm run dev
```

Wrangler will start a local Worker. Use `ngrok` (or any tunnel) to expose it to Twilio for testing inbound calls.

### 5. Deploy

Set production secrets:

```bash
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_PHONE_NUMBER
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Deploy:

```bash
npm run deploy
```

You'll get a URL like `https://voiceforge-app.<your-subdomain>.workers.dev`.

### 6. Point Twilio at your Worker

In the Twilio console, on your phone number's voice configuration:

- **A call comes in:** Webhook, `POST` to `https://<your-worker>.workers.dev/voice`
- **Call status changes:** `POST` to `https://<your-worker>.workers.dev/voice/status`

### 7. Call the number

Call your Twilio number. The receptionist greets you in the configured language. Speak. It responds. Hang up. Check your Supabase `calls` and `transcripts` tables to see the log.

## Customizing

### Change the business

Edit `src/prompts.ts`. Replace the placeholders with your business name, hours, services, etc.

### Change the language

Set `DEFAULT_LANGUAGE` in `wrangler.toml` to `en`, `fr`, or any language you've added a prompt for in `src/prompts.ts`.

### Change the voice

Set `TWILIO_VOICE` in `wrangler.toml`. Browse available Polly voices here: https://www.twilio.com/docs/voice/twiml/say/text-speech

### Swap providers

Want OpenAI instead of Claude? In `src/index.ts`, replace:

```ts
import { anthropic } from 'voiceforge/adapters/llm/anthropic'
// ...
llm: anthropic({ apiKey: env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-5' }),
```

with:

```ts
import { openai } from 'voiceforge/adapters/llm/openai' // when available
// ...
llm: openai({ apiKey: env.OPENAI_API_KEY, model: 'gpt-4o' }),
```

Same pattern for any other layer (TTS, storage, runtime).

## Endpoints

| Path | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check |
| `/voice` | POST | Initial inbound call (Twilio webhook) |
| `/voice/gather` | POST | Speech result (Twilio gather webhook) |
| `/voice/status` | POST | Call status callback (Twilio status webhook) |

## Troubleshooting

See `voiceforge/references/troubleshooting.md` for common issues.

## License

MIT (this scaffolded code is yours to modify and own).
