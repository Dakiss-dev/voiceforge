/**
 * VoiceForge App — Cloudflare Workers reference template.
 *
 * Composes a receptionist using:
 *  - Twilio   (PhoneProvider)  - inbound voice + built-in STT via <Gather>
 *  - Anthropic Claude (LLMProvider)
 *  - Supabase (StorageProvider) - calls, transcripts, leads
 *
 * Twilio's <Say> with Polly Neural voices handles TTS in Phase 1. To swap
 * to ElevenLabs (Phase 1.5), wire the TTS adapter into a custom
 * voice-response pipeline that exposes audio at /audio/<id> and uses
 * <Play> in the TwiML response.
 */

import { createReceptionist } from 'voiceforge/core'
import { twilio } from 'voiceforge/adapters/phone/twilio'
import { anthropic } from 'voiceforge/adapters/llm/anthropic'
import { supabase } from 'voiceforge/adapters/storage/supabase'
import { systemPrompts } from './prompts'

export interface Env {
  // Secrets
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
  ANTHROPIC_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Vars (defined in wrangler.toml)
  DEFAULT_LANGUAGE?: string
  TWILIO_VOICE?: string
  TWILIO_VOICE_LANGUAGE?: string
}

let cached: ReturnType<typeof createReceptionist> | null = null

function getReceptionist(env: Env) {
  if (cached) return cached

  cached = createReceptionist({
    phone: twilio({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      voice: env.TWILIO_VOICE || 'Polly.Lea-Neural',
      language: env.TWILIO_VOICE_LANGUAGE || 'fr-FR',
    }),
    llm: anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      model: 'claude-sonnet-4-5',
    }),
    storage: supabase({
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    }),
    prompts: systemPrompts,
    defaultLanguage: env.DEFAULT_LANGUAGE || 'fr',
  })

  return cached
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return getReceptionist(env).fetch(req)
  },
}
