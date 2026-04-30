---
name: voiceforge
description: Scaffold a provider-agnostic AI voice agent (phone receptionist, voice bot, agent line). The user picks their stack — any LLM, TTS, STT, phone provider, runtime, storage. Use when the user wants to build an AI phone agent, AI receptionist, voice bot, replace a phone-answering SaaS like Ruby or Smith.ai, or swap out the voice features in a HighLevel / GHL setup.
---

# VoiceForge

You are helping the user scaffold a new AI voice agent project using the VoiceForge skill.

## When to use this skill

Trigger when the user mentions:
- Building an AI receptionist or voice agent
- Replacing a phone-answering service (Ruby Receptionists, Smith.ai, etc.)
- Replacing GHL / HighLevel voice features
- Building a Twilio + Claude / OpenAI / Gemini voice bot
- Setting up an inbound call automation
- Need a voice line that books appointments, qualifies leads, or routes calls

## Workflow

### 1. Confirm intent and project context

Ask the user:
- What business is this for? (Used in the system prompt and welcome message)
- Primary language? (French, English, multilingual?)
- Project name? (Default to a slug of the business name)
- Path? (Default to `./<project-name>` in the user's current working directory)

### 2. Pick the stack

Walk the user through the 7 layers. Suggest the Phase 1 reference defaults, but offer all known providers so they can mix-and-match. If a provider isn't yet implemented, mark it as "coming in Phase 2" and either skip it or ask the user to write the adapter.

| Layer | Phase 1 default | Other Phase 1 options | Phase 2 options |
|---|---|---|---|
| Phone | Twilio | — | Vonage, Telnyx, Plivo, SignalWire |
| LLM | Anthropic Claude | — | OpenAI GPT, Google Gemini, Ollama, vLLM |
| TTS | ElevenLabs | — | OpenAI Voice, Cartesia, PlayHT, Google TTS, Deepgram Aura |
| STT | Deepgram | (or use phone provider's built-in STT) | OpenAI Whisper, AssemblyAI, Google STT |
| Storage | Supabase | — | Postgres, Firebase, MongoDB, SQLite, Turso |
| Runtime | Cloudflare Workers | — | Vercel, Node, Bun, Deno, Fly.io |
| Framework | VoiceForge core | — | LiveKit Agents, Vercel AI SDK, ElevenLabs Conversational, Pipecat |

### 3. Discover credentials

Check for existing `.env` or `.env.local` in the user's working directory. Identify which keys are present and which are missing. Print the missing keys checklist with links to where to get them. Reference `references/<provider>-setup.md` for each.

### 4. Scaffold the project

- Create the project directory at the user's chosen path
- Copy `templates/app/` into the project
- Substitute placeholders: business name, hours, services, language defaults
- Wire the chosen adapters into `src/index.ts`
- Generate the runtime config file (`wrangler.toml` for Cloudflare Workers, `vercel.json` for Vercel, etc.)
- Run the storage migration against the user's storage provider, OR print the SQL/schema for manual run

### 5. Print next steps

Bilingual checklist:
- Install dependencies: `npm install`
- Local dev: `npm run dev`
- Deploy: `npm run deploy`
- Point your phone provider's webhook to: `https://<deployed-url>/voice`
- Test: call the number

## Architecture reference

See `ARCHITECTURE.md` in the skill directory for the full design. The TL;DR:

- `core/interfaces.ts` defines the contracts (`PhoneProvider`, `LLMProvider`, `TTSProvider`, `STTProvider`, `StorageProvider`)
- `adapters/<layer>/<provider>/` implements those contracts
- The user's scaffolded app composes them via `createReceptionist({ phone, llm, tts, storage, ... })`

## Adapter authoring

If the user wants to add a new adapter (e.g., for Cartesia TTS), guide them through:

1. Read `references/adapter-guide.md`
2. Pick the right interface from `core/interfaces.ts`
3. Implement it in `adapters/<layer>/<provider>/index.ts`
4. Add a stub README explaining config, env vars, and limitations
5. Open a PR with a working test

## Notes for Claude when running the skill

- Default to French language for the system prompt template if the user is francophone or doesn't specify
- Always check for the `ANTHROPIC_API_KEY` already present in the user's env — if it is, prefer the Anthropic LLM adapter
- If the user is on macOS without a Twilio account yet, link them directly to `references/twilio-setup.md`
- Keep the wizard concise. Don't ask 30 questions. Pick smart defaults and let the user override
