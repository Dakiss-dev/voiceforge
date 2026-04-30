# Troubleshooting

## Caller hears silence

- Check Twilio webhook URL points to your Worker, ends with `/voice`, uses POST.
- Verify Worker `/health` returns 200.
- Tail Worker logs (`npm run tail`) while you call. If no requests appear, Twilio is misconfigured or the Worker URL is wrong.

## Caller hears the greeting then nothing

- The `/voice/gather` webhook isn't being hit. Check `gatherActionPath` in your Twilio adapter config matches what Twilio is POSTing to (default: `/voice/gather`).
- Speech wasn't detected. Check Twilio Console → Logs → call SID for `SpeechResult`. If empty, the caller didn't speak loud enough or the language tag is wrong.

## "Je n'ai pas bien compris" loop

- Twilio's `<Gather speechTimeout>` is too aggressive. Try `speechTimeout: 3` (seconds) instead of `auto`.
- The wrong language tag is set. `fr-FR` for France French, `fr-CA` for Quebec, `en-US` for US English. Mismatched language hurts STT accuracy badly.

## Claude responds slowly

- Voice replies should target <500ms. If Claude's TTFT is too high:
  - Use `claude-haiku` for faster responses (lower quality but acceptable for many use cases)
  - Reduce `maxTokens` in the LLM config (default 256 in the Worker, can go to 128)
  - Pre-cache the system prompt (Phase 2 feature)

## Claude gives long-winded responses

- Tighten the system prompt. Add: "Maximum 1-2 sentences per reply. Never exceed 30 words."
- Lower `maxTokens` to 128.

## Conversation context is lost between turns

- Check Supabase `transcripts` table for the call. If turns are missing, `saveTranscript` is failing. Check Worker logs.
- Service role key issue. The anon key cannot write. Use `SUPABASE_SERVICE_ROLE_KEY`.

## Supabase writes failing

- `permission denied`: using the wrong key. Swap to `service_role`.
- `relation does not exist`: schema migration didn't run. Run the SQL from `templates/supabase/migrations/0001_calls_schema.sql`.
- `connection timeout`: Supabase project paused (free tier after 7 days inactive). Reactivate.

## ElevenLabs audio cuts off

- This is the streaming chunking issue. Use the adapter's built-in `streamToAsyncIterable` helper without modification.
- Increase `chunk_length_schedule` if you've customized voice settings.

## High Twilio voice charges

- Reduce silence padding. Twilio bills per minute of voice including silence. Have your prompt encourage concise responses.
- Cap call duration in the Worker (Phase 2: add a max-turns guard).

## "Maximum recursion" or rapid-fire requests

- Twilio's `<Redirect>` fallback can cause loops if `/voice/gather` always returns another `<Gather>` with no exit condition. Add a max-turn counter in the system prompt and have Claude wrap up after N turns.

## Strange characters in caller speech

- Twilio STT sometimes returns punctuation differently per language. Don't try to clean the transcript before sending to Claude — Claude handles fuzzy input fine.

## Cold-start latency

- Cloudflare Workers cold-starts are ~5ms. If you see >200ms on first request, the bottleneck is downstream (Anthropic, Supabase). Profile each call.

## Need to reset a stuck call

- Delete the row in Supabase `calls` table. Future webhooks for that CallSid will fail (no session) and Twilio will hang up.

## Adding a new language

1. Add a system prompt to `src/prompts.ts` keyed by the language code
2. Set `TWILIO_VOICE_LANGUAGE` to the BCP-47 tag (e.g. `es-ES`)
3. Set `TWILIO_VOICE` to a Polly voice for that language
4. Set `DEFAULT_LANGUAGE` to your primary language

## Where to ask for help

- GitHub issues: https://github.com/Dakiss-dev/voiceforge/issues
- Skool community (link forthcoming)
