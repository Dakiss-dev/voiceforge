# ElevenLabs TTS Adapter

**Status:** Phase 1, in progress

Implements: `TTSProvider` from `core/interfaces.ts`.

ElevenLabs is the reference TTS-provider adapter. Multilingual, high-quality voices.

## Will support (Phase 1)

- Text-to-speech with chosen voice ID
- Multilingual (French, English at minimum)
- Streaming audio (returned as `AudioStream`)

## Phase 2

- Voice cloning workflow helpers
- Real-time turn-detection integration with conversational endpoints

## Required environment

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID` (recommended preset to be added in `references/elevenlabs-setup.md`)

## Links

- ElevenLabs docs: https://elevenlabs.io/docs
- Voice library: https://elevenlabs.io/voice-library
- Pricing: https://elevenlabs.io/pricing
