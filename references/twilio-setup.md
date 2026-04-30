# Twilio Setup

## Get a Twilio account

1. Sign up: https://www.twilio.com/try-twilio
2. Verify your phone number and email
3. From the Console (https://console.twilio.com), grab:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`

## Buy a phone number

1. Console → Phone Numbers → Manage → Buy a number
2. Filter by country and capability — you need **Voice**
3. For French Canadian: filter Canada, area code 514 / 438 / 450 (Montreal) or 418 (Quebec City)
4. For French France: filter France, mobile or geographic numbers
5. Buy. Add to env as `TWILIO_PHONE_NUMBER` in E.164 format (`+15551234567`)

## Configure webhook

After your Worker is deployed (see `deployment.md`):

1. Console → Phone Numbers → Manage → Active numbers → click your number
2. Under **Voice Configuration**:
   - **A call comes in:** Webhook
   - **URL:** `https://<your-worker>.workers.dev/voice`
   - **HTTP method:** POST
3. Under **Call status changes:**
   - **URL:** `https://<your-worker>.workers.dev/voice/status`
   - **HTTP method:** POST
4. Save

## Local testing with ngrok

For local dev, expose your Wrangler dev server publicly:

```bash
# In one terminal:
npm run dev   # wrangler dev, listens on localhost:8787

# In another terminal:
ngrok http 8787
```

Take the ngrok URL (like `https://abc-123.ngrok-free.app`) and use it as the webhook URL in Twilio for testing.

## Voices

VoiceForge defaults to `Polly.Lea-Neural` (French) via Twilio's `<Say>` verb. Pick a voice that matches your audience:

| Language | Voice | Notes |
|---|---|---|
| French (France) | `Polly.Lea-Neural` | Modern French, female |
| French (Canada) | `Polly.Chantal-Neural` | Quebec accent, female |
| English (US) | `Polly.Joanna-Neural` | Standard, female |
| English (UK) | `Polly.Amy-Neural` | British, female |
| Spanish | `Polly.Lupe-Neural` | US Spanish, female |

Full list: https://www.twilio.com/docs/voice/twiml/say/text-speech

Set `TWILIO_VOICE` in your `wrangler.toml` to override.

## Pricing

- Phone number: ~$1-15/mo depending on country
- Voice usage: ~$0.013-0.030 per minute (inbound)
- `<Gather input="speech">` STT: included in voice rate (no extra)
- Polly Neural TTS via `<Say>`: ~$0.024 per 1000 chars

For a small business taking 30 calls/month at 3 min each = ~$3/mo voice + number cost.

## Troubleshooting

**No webhook hits:** Check the Twilio number's voice config saved the right URL. Test with `curl https://<your-worker>.workers.dev/health` first.

**Webhook hits but caller hears silence:** The Worker is responding but TwiML may be malformed. Check Cloudflare Workers logs (`npm run tail`).

**Speech recognition is bad:** Set `language` to match the caller's accent. `fr-CA` for Quebec, `fr-FR` for France. The `<Gather speechModel>` defaults to `phone_call` which is best for telephony.
