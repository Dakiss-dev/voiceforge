# Architecture

VoiceForge is built around a strict adapter pattern. The core defines provider-agnostic interfaces. Reference adapters implement them. Users compose adapters into a working voice agent.

## The 7 layers

```
                    ┌──────────────────────┐
Inbound call ──────►│   Phone Provider     │  Twilio | Vonage | Telnyx | Plivo
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   STT (optional)     │  Deepgram | Whisper | AssemblyAI
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   LLM Provider       │  Claude | GPT | Gemini | Ollama
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   TTS Provider       │  ElevenLabs | OpenAI | Cartesia | Google
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Storage            │  Supabase | Postgres | Firebase | SQLite
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Runtime            │  CF Workers | Vercel | Node | Bun
                    └──────────────────────┘
```

## The contract

See `core/interfaces.ts` for the full TypeScript definitions. The five interfaces every voice agent needs:

| Interface | Job |
|---|---|
| `PhoneProvider` | Handle inbound webhooks, build voice responses (TwiML, Vonage NCCO, etc.) |
| `LLMProvider` | Reasoning, tool use, response generation |
| `TTSProvider` | Text → audio |
| `STTProvider` | Audio → text (optional, depending on phone provider's built-in STT) |
| `StorageProvider` | Persist calls, transcripts, leads |

A composition layer (`createReceptionist` in `core/`) takes those adapters and exposes a `fetch(req)` handler that any runtime can serve.

## Composition

The user's app composes adapters via `createReceptionist`:

```ts
import { createReceptionist } from 'voiceforge/core'
import { twilio } from 'voiceforge/adapters/phone/twilio'
import { anthropic } from 'voiceforge/adapters/llm/anthropic'
import { elevenlabs } from 'voiceforge/adapters/tts/elevenlabs'
import { supabase } from 'voiceforge/adapters/storage/supabase'

export default createReceptionist({
  phone: twilio({ accountSid: env.TWILIO_SID, authToken: env.TWILIO_TOKEN }),
  llm: anthropic({ apiKey: env.ANTHROPIC_KEY, model: 'claude-sonnet-4-6' }),
  tts: elevenlabs({ apiKey: env.ELEVENLABS_KEY, voiceId: env.VOICE_ID }),
  storage: supabase({ url: env.SUPABASE_URL, key: env.SUPABASE_KEY }),
  prompts: { fr: './prompts/fr.md', en: './prompts/en.md' },
})
```

Want OpenAI instead of Claude? Change one line:

```ts
import { openai } from 'voiceforge/adapters/llm/openai'
// ...
llm: openai({ apiKey: env.OPENAI_KEY, model: 'gpt-4o' }),
```

Want Cartesia instead of ElevenLabs? Change one line.

Want to run on Vercel instead of Cloudflare Workers? Change the runtime export, the rest is unchanged.

## Why this design

1. **No vendor lock-in.** Swap any provider in one line. Migrate without rewriting.
2. **Cost flexibility.** Run cheap (Gemini Flash + Cartesia) or premium (Claude + ElevenLabs) per use case.
3. **Testability.** Mock any layer with an in-memory adapter for tests.
4. **Self-hostability.** Use Ollama for LLM if you want fully self-hosted.
5. **Extensibility.** New provider lands? Implement the interface, ship the adapter.

## Status of adapters

| Layer | Provider | Status |
|---|---|---|
| Phone | Twilio | Phase 1 (in progress) |
| Phone | Vonage / Telnyx / Plivo | Phase 2 |
| LLM | Anthropic | Phase 1 (in progress) |
| LLM | OpenAI / Google / Ollama | Phase 2 |
| TTS | ElevenLabs | Phase 1 (in progress) |
| TTS | OpenAI / Cartesia / Google | Phase 2 |
| STT | Deepgram | Phase 1 (in progress) |
| STT | OpenAI Whisper / AssemblyAI | Phase 2 |
| Storage | Supabase | Phase 1 (in progress) |
| Storage | Postgres / Firebase / SQLite | Phase 2 |
| Runtime | Cloudflare Workers | Phase 1 (in progress) |
| Runtime | Vercel / Node / Bun | Phase 2 |
| Framework | VoiceForge core (Hono-based) | Phase 1 (in progress) |
| Framework | LiveKit Agents / Vercel AI SDK / ElevenLabs Conversational | Phase 2 |

## Adding a new adapter

See `references/adapter-guide.md` for the contract, naming conventions, and PR template.

## Design principles

- **Interfaces are immutable in v1.** Once published, an interface signature is a contract. Breaking changes require a major version bump.
- **Adapters are independent.** No adapter depends on another adapter. They only depend on `core/interfaces.ts`.
- **Configuration is explicit.** Adapters take config objects, not env vars. The user's app is responsible for reading env. This makes adapters trivial to test and reuse.
- **Streaming first.** Audio interfaces use `AsyncIterator<Uint8Array>` so streaming TTS is the default, not an afterthought.
- **No magic.** Every line of generated code is human-readable. The wizard substitutes placeholders, not generated abstractions.
