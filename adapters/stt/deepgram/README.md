# Deepgram STT Adapter

**Status:** Phase 1, in progress (optional)

Implements: `STTProvider` from `core/interfaces.ts`.

Deepgram is the reference STT-provider adapter. Use this when you need higher-quality or multi-language transcription than Twilio's built-in `<Gather input="speech">` provides, or when using a phone provider without built-in STT.

## When you don't need this

If using the Twilio adapter with `<Gather input="speech">`, you do NOT need a separate STT adapter for Phase 1. Twilio's built-in STT is good enough for most receptionist use cases.

## Will support (Phase 1)

- Streaming transcription from `AudioStream`
- Language hint passthrough
- Confidence scores

## Required environment

- `DEEPGRAM_API_KEY`

## Links

- Deepgram docs: https://developers.deepgram.com/
- Pricing: https://deepgram.com/pricing
