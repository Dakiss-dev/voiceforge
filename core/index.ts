/**
 * VoiceForge core — composition + HTTP routing.
 *
 * The createReceptionist function takes a ReceptionistConfig (composed
 * adapters + prompts) and returns a Receptionist with a fetch handler
 * suitable for any runtime that speaks the Web Fetch API (Cloudflare
 * Workers, Vercel, Node 18+, Bun, Deno).
 */

import type {
  Receptionist,
  ReceptionistConfig,
  Message,
  TranscriptEntry,
} from './interfaces'

export * from './interfaces'

/**
 * Default greetings per language. Override by passing prompts in config or
 * by handling the first /voice request differently in your own runtime.
 */
const DEFAULT_GREETINGS: Record<string, string> = {
  fr: "Bonjour, comment puis-je vous aider aujourd'hui ?",
  en: 'Hello, how can I help you today?',
}

/**
 * Token budget per turn. Voice replies should be short (1-2 sentences) so
 * latency stays human-paced.
 */
const DEFAULT_MAX_TOKENS = 256

export function createReceptionist(config: ReceptionistConfig): Receptionist {
  const defaultLanguage = config.defaultLanguage || 'fr'

  return {
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url)
      const method = req.method.toUpperCase()

      // Health check
      if (url.pathname === '/health') {
        return new Response('ok', { status: 200 })
      }

      // Initial inbound call
      if (url.pathname === '/voice' && method === 'POST') {
        try {
          const { session, caller } = await config.phone.handleIncomingCall(req)

          await config.storage.saveCall({
            id: session.id,
            providerCallSid: session.id,
            callerNumber: caller.number,
            businessNumber: typeof caller.metadata?.to === 'string' ? caller.metadata.to : '',
            startedAt: session.startedAt,
            status: 'in_progress',
            language: session.language,
            metadata: {
              callerCity: caller.city,
              callerCountry: caller.countryCode,
            },
          })

          const language = session.language || defaultLanguage
          const greeting = pickGreeting(language)

          await config.storage.saveTranscript(session.id, {
            role: 'assistant',
            content: greeting,
            ts: new Date(),
          })

          return config.phone.buildVoiceResponse({
            text: greeting,
            next: 'gather',
            gatherPrompt: greeting,
          })
        } catch (err) {
          console.error('[voiceforge] /voice error', err)
          return config.phone.buildVoiceResponse({
            text: 'Désolé, une erreur s\'est produite. Veuillez rappeler plus tard.',
            next: 'hangup',
          })
        }
      }

      // User speech result
      if (url.pathname === '/voice/gather' && method === 'POST') {
        try {
          const { transcript, sessionId } = await config.phone.extractSpeechResult(req)

          // Empty transcript means Twilio didn't catch anything. Re-prompt.
          if (!transcript || transcript.trim().length === 0) {
            return config.phone.buildVoiceResponse({
              text: 'Je n\'ai pas bien compris. Pouvez-vous répéter ?',
              next: 'gather',
              gatherPrompt: 'Je n\'ai pas bien compris. Pouvez-vous répéter ?',
            })
          }

          await config.storage.saveTranscript(sessionId, {
            role: 'user',
            content: transcript,
            ts: new Date(),
          })

          const call = await config.storage.getCall(sessionId)
          if (!call) {
            return config.phone.buildVoiceResponse({
              text: 'Session introuvable. Veuillez rappeler.',
              next: 'hangup',
            })
          }

          const transcripts = await config.storage.getTranscripts(sessionId)
          const messages: Message[] = transcriptsToMessages(transcripts)

          const language = call.language || defaultLanguage
          const systemPrompt = pickPrompt(config.prompts, language)

          const response = await config.llm.reason({
            messages,
            system: systemPrompt,
            maxTokens: DEFAULT_MAX_TOKENS,
          })

          await config.storage.saveTranscript(sessionId, {
            role: 'assistant',
            content: response.content,
            ts: new Date(),
          })

          // Hang up if the response signals end of conversation.
          const shouldHangup = isHangupSignal(response.content)

          return config.phone.buildVoiceResponse({
            text: response.content,
            next: shouldHangup ? 'hangup' : 'gather',
            gatherPrompt: response.content,
          })
        } catch (err) {
          console.error('[voiceforge] /voice/gather error', err)
          return config.phone.buildVoiceResponse({
            text: 'Désolé, une erreur technique. Au revoir.',
            next: 'hangup',
          })
        }
      }

      // Status callback (call ended)
      if (url.pathname === '/voice/status' && method === 'POST') {
        try {
          const { sessionId, durationSeconds, status } =
            await config.phone.extractStatusCallback(req)

          const call = await config.storage.getCall(sessionId)
          if (call) {
            await config.storage.saveCall({
              ...call,
              endedAt: new Date(),
              durationSeconds,
              status,
            })
          }
          return new Response('', { status: 204 })
        } catch (err) {
          console.error('[voiceforge] /voice/status error', err)
          return new Response('', { status: 500 })
        }
      }

      return new Response('Not found', { status: 404 })
    },
  }
}

// ============================================================
// Helpers
// ============================================================

function pickGreeting(language: string): string {
  return DEFAULT_GREETINGS[language] || DEFAULT_GREETINGS['fr']!
}

function pickPrompt(
  prompts: ReceptionistConfig['prompts'],
  language: string,
): string {
  return (
    prompts[language] ||
    prompts['fr'] ||
    prompts['en'] ||
    Object.values(prompts)[0] ||
    'You are a helpful AI receptionist.'
  )
}

function transcriptsToMessages(transcripts: TranscriptEntry[]): Message[] {
  // Filter system entries (system prompt is passed separately to the LLM)
  // and map to LLM message shape. Sort by timestamp ascending.
  return transcripts
    .filter((t) => t.role !== 'system')
    .sort((a, b) => a.ts.getTime() - b.ts.getTime())
    .map((t) => ({
      role: t.role,
      content: t.content,
    }))
}

function isHangupSignal(text: string): boolean {
  const lower = text.toLowerCase()
  // French and English hangup signals. Easy to extend per language.
  const signals = [
    'au revoir',
    'bonne journée',
    'à bientôt',
    'goodbye',
    'have a good day',
    'have a great day',
  ]
  return signals.some((s) => lower.includes(s))
}
