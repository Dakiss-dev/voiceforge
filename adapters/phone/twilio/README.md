# Twilio Phone Adapter

**Status:** Phase 1, in progress

Implements: `PhoneProvider` from `core/interfaces.ts`.

Twilio is the reference phone-provider adapter. Receives inbound voice calls, returns TwiML responses, extracts speech results, handles status callbacks.

## Will support (Phase 1)

- Inbound voice webhook handling
- TwiML response building (Say, Play, Gather, Hangup)
- Speech-to-text via Twilio's built-in `<Gather input="speech">` (no separate STT adapter needed)
- Status callback for call duration and outcome

## Phase 2

- WebSocket media streams (for low-latency streaming TTS)
- Outbound call placement
- SMS callbacks tied to a voice session

## Required environment

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (the inbound number)

## Links

- Twilio Voice docs: https://www.twilio.com/docs/voice
- TwiML reference: https://www.twilio.com/docs/voice/twiml
