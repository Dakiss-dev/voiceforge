/**
 * ElevenLabs TTS Adapter
 *
 * Implements TTSProvider using ElevenLabs streaming text-to-speech.
 *
 * NOTE on Phase 1 integration: Twilio's <Play> requires a publicly
 * accessible audio URL. To use ElevenLabs in the receptionist loop,
 * the runtime must expose an /audio/<id> endpoint that serves the
 * synthesized audio. The reference templates/app/ uses Twilio's built-in
 * Polly voices for simplicity; swap to ElevenLabs in Phase 1.5 by
 * adding the /audio endpoint and changing buildVoiceResponse to use
 * the audio URL.
 */

import type { TTSProvider } from '../../../core/interfaces'

export interface ElevenLabsConfig {
  apiKey: string
  /** Default voice ID. Override per call via voice.voiceId. */
  voiceId: string
  /**
   * Model ID. Default: "eleven_turbo_v2_5" (low latency, good for voice).
   * Other options: "eleven_multilingual_v2", "eleven_flash_v2_5".
   */
  modelId?: string
  /** Override base URL. */
  baseUrl?: string
  /** Output format. Default: "mp3_22050_32" (low bandwidth, good for voice). */
  outputFormat?: string
}

export function elevenlabs(config: ElevenLabsConfig): TTSProvider {
  const baseUrl = config.baseUrl || 'https://api.elevenlabs.io'
  const modelId = config.modelId || 'eleven_turbo_v2_5'
  const outputFormat = config.outputFormat || 'mp3_22050_32'

  return {
    async synthesize({ text, voice }) {
      const voiceId = voice.voiceId || config.voiceId
      const url = `${baseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=${encodeURIComponent(outputFormat)}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: voice.stability ?? 0.5,
            similarity_boost: 0.75,
            speed: voice.speed ?? 1.0,
          },
          ...(voice.language ? { language_code: voice.language } : {}),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(
          `ElevenLabs TTS failed: ${response.status} ${response.statusText} ${errorText}`,
        )
      }

      if (!response.body) {
        throw new Error('ElevenLabs TTS returned no body')
      }

      return streamToAsyncIterable(response.body)
    },
  }
}

async function* streamToAsyncIterable(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<Uint8Array, void, undefined> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      if (value) yield value
    }
  } finally {
    reader.releaseLock()
  }
}
