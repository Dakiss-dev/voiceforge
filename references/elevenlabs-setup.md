# ElevenLabs Setup

ElevenLabs provides higher-quality voices than Twilio's built-in Polly, especially for non-English languages. Phase 1 walking prototype uses Polly via `<Say>` for simplicity. Use this guide when you're ready to upgrade to ElevenLabs (Phase 1.5).

## Get an account

1. Sign up: https://elevenlabs.io/sign-up
2. Settings → Profile → API Keys
3. Generate a key. Add to env as `ELEVENLABS_API_KEY`.

## Pick a voice

Voice library: https://elevenlabs.io/voice-library

For French Canadian customer-facing receptionists, recommended starting voices (subject to ElevenLabs library updates):

- **Bella** (multilingual, warm, professional) — works for French and English
- **Charlotte** (multilingual, gentle) — works for French
- Search the library for "French" + "Female" + "Calm" or "Friendly"

Click any voice → "Use" → copy the **Voice ID**. Add to env as `ELEVENLABS_VOICE_ID`.

## Models

VoiceForge defaults to `eleven_turbo_v2_5` for low latency on phone calls. Other options:

| Model | Latency | Quality | Use case |
|---|---|---|---|
| `eleven_turbo_v2_5` | ~400ms | Good | Real-time voice (default) |
| `eleven_flash_v2_5` | ~75ms | OK | Ultra-low latency |
| `eleven_multilingual_v2` | ~800ms | Best | Pre-rendered, non-realtime |

Set `modelId` in the adapter config to override.

## Wiring ElevenLabs into the Twilio loop (Phase 1.5)

This requires the Worker to expose audio at a public URL so Twilio can `<Play>` it.

Pattern:

1. On `/voice/gather`, after Claude generates a reply text:
2. Call `tts.synthesize({ text, voice })` → returns an `AudioStream`
3. Stash the audio in Cloudflare KV / Cache API / R2 keyed by a generated ID
4. Build TwiML with `<Play>https://<worker>/audio/<id></Play>` instead of `<Say>`
5. Add a route handler for `/audio/:id` that serves the cached audio

Reference implementation will land in Phase 1.5. For now the adapter is ready, the wiring is documented but not in the default template.

## Pricing

- Free tier: 10K chars/month
- Creator: $22/mo for 100K chars
- Pro: $99/mo for 500K chars

A typical receptionist response is ~80 chars. 30 calls/month with 5 turns each = ~12K chars/mo. Free tier covers it.

## Troubleshooting

**API returns 401:** Wrong API key.

**API returns 404:** Voice ID doesn't exist or your account doesn't have access. Check the voice library.

**Audio plays but cuts off:** Streaming chunks are not being assembled in order. The default async iterator handles this correctly; if you've custom-wrapped the stream, ensure you write chunks to the response in receive order.

**Latency too high:** Switch to `eleven_flash_v2_5`. Trade-off: voice sounds slightly more synthetic.
