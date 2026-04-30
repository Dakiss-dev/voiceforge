# VoiceForge

> Construis ton agent vocal IA. N'importe quel modèle. N'importe quel framework. N'importe quelle stack.

VoiceForge est un skill Claude Code qui scaffold un agent vocal IA complet, réceptionniste, voicebot, ligne d'agent, sans te lock-in dans un fournisseur.

## Pourquoi VoiceForge

En 2026, construire un agent vocal IA ne devrait pas signifier signer 5 ans avec un seul fournisseur. Pourtant, la plupart des frameworks te forcent à choisir : ElevenLabs *ou* Cartesia. Twilio *ou* rien. Claude *ou* GPT. Vercel *ou* Cloudflare.

VoiceForge inverse ça. Tu choisis ta stack, le skill génère le code qui colle.

```
Téléphone     →  Twilio | Vonage | Telnyx | Plivo
LLM           →  Claude | GPT | Gemini | Ollama
TTS           →  ElevenLabs | OpenAI | Cartesia | Google
STT           →  Deepgram | Whisper | AssemblyAI
Storage       →  Supabase | Postgres | Firebase | SQLite
Runtime       →  Cloudflare Workers | Vercel | Node | Bun
Framework     →  VoiceForge core | LiveKit Agents | Vercel AI SDK | ElevenLabs Conversational
```

Tu changes de fournisseur plus tard ? Une ligne à modifier.

## Quick Start

```bash
# Installe le skill dans Claude Code
git clone https://github.com/Dakiss-dev/voiceforge ~/.claude/skills/voiceforge

# Dans n'importe quel dossier de projet
claude /voiceforge init
```

Le wizard te demande ta stack, scaffold le projet, te donne la checklist de déploiement. 10 minutes du zéro au numéro qui répond.

## Architecture en deux phrases

Le `core/` définit des interfaces (`PhoneProvider`, `LLMProvider`, `TTSProvider`, `STTProvider`, `StorageProvider`).
Les `adapters/` implémentent ces interfaces pour chaque fournisseur. Tu composes ce que tu veux.

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

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour la vision complète.

## Statut

- **Phase 1 (en cours)** : Interfaces + adaptateurs de référence (Twilio, Claude, ElevenLabs, Deepgram, Supabase, Cloudflare Workers)
- **Phase 2** : Booking + SMS + adaptateurs additionnels (OpenAI, Gemini, Cartesia, Vercel, Postgres, Telnyx, LiveKit Agents)

## Pourquoi je build ça

Je suis Ali Dakissaga. Je construis des trucs IA-natifs en Claude Code. VoiceForge est mon flagship open-source : la preuve qu'on n'a plus besoin de payer 497$/mo à HighLevel pour avoir un agent vocal qui marche.

- GitHub : [@Dakiss-dev](https://github.com/Dakiss-dev)
- YouTube : (à venir)
- Communauté Skool : (à venir)

## Contribuer

Tu veux ajouter un adaptateur ? Lis [`references/adapter-guide.md`](./references/adapter-guide.md), implémente l'interface qui correspond, ouvre une PR. Les adaptateurs propres sont mergés rapidement.

## License

MIT. Build avec, fork-le, modifie-le, vends ce que tu construis avec. Si tu écris un adaptateur qui marche, considère un PR.
