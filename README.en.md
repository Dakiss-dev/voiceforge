# VoiceForge

> Build your AI voice agent. Any model. Any framework. Any stack.

VoiceForge is a Claude Code skill that scaffolds a complete AI voice agent — receptionist, voicebot, agent line — without locking you into a single provider.

## Why VoiceForge

In 2026, building an AI voice agent shouldn't mean signing a 5-year deal with one vendor. Yet most frameworks force the choice: ElevenLabs *or* Cartesia. Twilio *or* nothing. Claude *or* GPT. Vercel *or* Cloudflare.

VoiceForge flips that. You pick your stack, the skill generates the code that fits.

```
Phone         →  Twilio | Vonage | Telnyx | Plivo
LLM           →  Claude | GPT | Gemini | Ollama
TTS           →  ElevenLabs | OpenAI | Cartesia | Google
STT           →  Deepgram | Whisper | AssemblyAI
Storage       →  Supabase | Postgres | Firebase | SQLite
Runtime       →  Cloudflare Workers | Vercel | Node | Bun
Framework     →  VoiceForge core | LiveKit Agents | Vercel AI SDK | ElevenLabs Conversational
```

Want to swap providers later? One line.

## Quick Start

```bash
# Install the skill in Claude Code
git clone https://github.com/Dakiss-dev/voiceforge ~/.claude/skills/voiceforge

# In any project directory
claude /voiceforge init
```

The wizard asks for your stack, scaffolds the project, prints the deploy checklist. 10 minutes from zero to a phone number that answers.

## Architecture in two sentences

`core/` defines interfaces (`PhoneProvider`, `LLMProvider`, `TTSProvider`, `STTProvider`, `StorageProvider`).
`adapters/` implements those interfaces per provider. You compose what you want.

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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full vision.

## Status

- **Phase 1 (in progress)**: Interfaces + reference adapters (Twilio, Claude, ElevenLabs, Deepgram, Supabase, Cloudflare Workers)
- **Phase 2**: Booking + SMS + additional adapters (OpenAI, Gemini, Cartesia, Vercel, Postgres, Telnyx, LiveKit Agents)

## Why I'm building this

I'm Ali Dakissaga. I build AI-native systems in Claude Code. VoiceForge is my open-source flagship: proof you don't need to pay $497/mo to HighLevel to have a voice agent that works.

- GitHub: [@Dakiss-dev](https://github.com/Dakiss-dev)
- YouTube: (coming soon)
- Skool community: (coming soon)

## Contributing

Want to add an adapter? Read [`references/adapter-guide.md`](./references/adapter-guide.md), implement the matching interface, open a PR. Clean adapters get merged fast.

## License

MIT. Build with it, fork it, modify it, sell what you build with it. If you write an adapter that works, consider a PR.
