/**
 * Twilio Phone Adapter
 *
 * Implements PhoneProvider using Twilio Programmable Voice + TwiML.
 * Uses <Gather input="speech"> for built-in STT, so no separate STT
 * adapter is required for Phase 1 receptionist use cases.
 */

import type {
  PhoneProvider,
  CallSession,
  CallerInfo,
  CallStatus,
} from '../../../core/interfaces'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  /**
   * Twilio voice for <Say>. See https://www.twilio.com/docs/voice/twiml/say/text-speech
   * Common French neural voice: "Polly.Lea-Neural"
   * Common English neural voice: "Polly.Joanna-Neural"
   */
  voice?: string
  /**
   * BCP-47 language tag for <Say> and <Gather speechModel>.
   * E.g. "fr-FR", "fr-CA", "en-US"
   */
  language?: string
  /**
   * Path that Twilio will POST to with speech results.
   * Default: "/voice/gather"
   */
  gatherActionPath?: string
  /**
   * Speech timeout in seconds, or "auto" to let Twilio decide.
   * Default: "auto"
   */
  speechTimeout?: number | 'auto'
}

export function twilio(config: TwilioConfig): PhoneProvider {
  const voice = config.voice || 'Polly.Lea-Neural'
  const language = config.language || 'fr-FR'
  const gatherActionPath = config.gatherActionPath || '/voice/gather'
  const speechTimeout = config.speechTimeout ?? 'auto'

  return {
    async handleIncomingCall(req) {
      const params = await parseTwilioWebhook(req)
      const callSid = params.CallSid || crypto.randomUUID()
      const session: CallSession = {
        id: callSid,
        callerInfo: { number: params.From || '' },
        startedAt: new Date(),
        language: shortLanguage(language),
      }
      const caller: CallerInfo = {
        number: params.From || '',
        countryCode: params.FromCountry,
        city: params.FromCity,
        metadata: {
          to: params.To || config.phoneNumber,
          callerName: params.CallerName,
        },
      }
      return { session, caller }
    },

    buildVoiceResponse({ text, next, gatherPrompt, transferTo }) {
      let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>'

      if (next === 'gather') {
        const promptText = gatherPrompt || text || ''
        const timeoutAttr =
          speechTimeout === 'auto'
            ? 'speechTimeout="auto"'
            : `speechTimeout="${speechTimeout}"`
        twiml += `<Gather input="speech" ${timeoutAttr} language="${escapeAttr(language)}" action="${escapeAttr(gatherActionPath)}" method="POST">`
        if (promptText) {
          twiml += `<Say voice="${escapeAttr(voice)}" language="${escapeAttr(language)}">${escapeXml(promptText)}</Say>`
        }
        twiml += `</Gather>`
        // Re-prompt fallback if Gather times out without speech
        twiml += `<Redirect method="POST">${escapeAttr(gatherActionPath)}</Redirect>`
      } else if (next === 'transfer' && transferTo) {
        if (text) {
          twiml += `<Say voice="${escapeAttr(voice)}" language="${escapeAttr(language)}">${escapeXml(text)}</Say>`
        }
        twiml += `<Dial>${escapeXml(transferTo)}</Dial>`
      } else {
        if (text) {
          twiml += `<Say voice="${escapeAttr(voice)}" language="${escapeAttr(language)}">${escapeXml(text)}</Say>`
        }
        twiml += `<Hangup/>`
      }

      twiml += '</Response>'

      return new Response(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      })
    },

    async extractSpeechResult(req) {
      const params = await parseTwilioWebhook(req)
      return {
        transcript: params.SpeechResult || '',
        sessionId: params.CallSid || '',
      }
    },

    async extractStatusCallback(req) {
      const params = await parseTwilioWebhook(req)
      return {
        sessionId: params.CallSid || '',
        durationSeconds: parseInt(params.CallDuration || '0', 10),
        status: mapTwilioStatus(params.CallStatus || ''),
      }
    },
  }
}

// ============================================================
// Helpers
// ============================================================

async function parseTwilioWebhook(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') || ''
  const params: Record<string, string> = {}

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    const urlParams = new URLSearchParams(text)
    for (const [key, value] of urlParams.entries()) {
      params[key] = value
    }
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    for (const [key, value] of formData.entries()) {
      params[key] = String(value)
    }
  } else {
    // Try parsing the URL query string as a fallback
    const url = new URL(req.url)
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value
    }
  }

  return params
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeAttr(s: string): string {
  return escapeXml(s)
}

function mapTwilioStatus(status: string): CallStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'busy':
    case 'no-answer':
    case 'canceled':
      return 'abandoned'
    default:
      return 'in_progress'
  }
}

function shortLanguage(bcp47: string): string {
  // "fr-FR" -> "fr", "en-US" -> "en"
  return bcp47.split('-')[0]?.toLowerCase() || 'fr'
}
