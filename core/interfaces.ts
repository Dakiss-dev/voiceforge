/**
 * VoiceForge — Provider-agnostic interfaces
 *
 * These contracts define the boundary between VoiceForge core and any provider
 * implementation. Adapters in adapters/<layer>/<provider>/ implement these.
 *
 * Stability: interfaces are versioned. v0.x may evolve before v1.0. After v1.0,
 * any breaking change to a published interface requires a major version bump.
 */

// ============================================================
// Shared domain types
// ============================================================

export type Role = 'system' | 'user' | 'assistant'

export type CallStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned'

export interface CallerInfo {
  number: string
  countryCode?: string
  city?: string
  metadata?: Record<string, unknown>
}

export interface CallSession {
  id: string
  callerInfo: CallerInfo
  startedAt: Date
  language: string
  metadata?: Record<string, unknown>
}

export interface Message {
  role: Role
  content: string
}

export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (input: unknown) => Promise<unknown>
}

export interface LLMResponse {
  content: string
  toolCalls?: Array<{ name: string; input: unknown }>
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface VoiceConfig {
  voiceId?: string
  language?: string
  stability?: number
  speed?: number
  metadata?: Record<string, unknown>
}

/**
 * Provider-agnostic audio stream. An async iterable of raw audio chunks.
 * Adapters are free to choose codec/sample rate; the consumer must adapt.
 */
export type AudioStream = AsyncIterable<Uint8Array>

export interface Transcript {
  text: string
  language?: string
  confidence?: number
  segments?: Array<{ text: string; start: number; end: number }>
}

export interface TranscriptEntry {
  role: Role
  content: string
  ts: Date
}

export interface Lead {
  callId: string
  name?: string
  phone?: string
  email?: string
  intent?: string
  notes?: string
}

export interface Call {
  id: string
  providerCallSid: string
  callerNumber: string
  businessNumber: string
  startedAt: Date
  endedAt?: Date
  durationSeconds?: number
  status: CallStatus
  language: string
  metadata?: Record<string, unknown>
}

// ============================================================
// Provider interfaces
// ============================================================

/**
 * PhoneProvider handles inbound voice webhooks and builds provider-specific
 * voice responses (TwiML for Twilio, NCCO for Vonage, etc.).
 */
export interface PhoneProvider {
  /**
   * Handle the initial inbound call webhook. Returns the caller info and a
   * session object that downstream calls can reference.
   */
  handleIncomingCall(req: Request): Promise<{ session: CallSession; caller: CallerInfo }>

  /**
   * Build a voice response in the provider's expected format.
   */
  buildVoiceResponse(opts: {
    audio?: AudioStream | Uint8Array
    text?: string
    next?: 'gather' | 'hangup' | 'transfer'
    gatherPrompt?: string
    transferTo?: string
  }): Response

  /**
   * Extract the speech result from a follow-up webhook.
   */
  extractSpeechResult(req: Request): Promise<{ transcript: string; sessionId: string }>

  /**
   * Extract status callback when a call ends.
   */
  extractStatusCallback(
    req: Request,
  ): Promise<{ sessionId: string; durationSeconds: number; status: CallStatus }>
}

/**
 * LLMProvider handles reasoning, tool use, and response generation.
 */
export interface LLMProvider {
  reason(opts: {
    messages: Message[]
    system: string
    tools?: Tool[]
    maxTokens?: number
  }): Promise<LLMResponse>
}

/**
 * TTSProvider converts text to audio.
 */
export interface TTSProvider {
  synthesize(opts: { text: string; voice: VoiceConfig }): Promise<AudioStream | Uint8Array>
}

/**
 * STTProvider converts audio to text. Optional — some phone providers (Twilio)
 * have built-in STT that may be sufficient.
 */
export interface STTProvider {
  transcribe(opts: { audio: AudioStream }): Promise<Transcript>
}

/**
 * StorageProvider persists calls, transcripts, and leads.
 */
export interface StorageProvider {
  saveCall(call: Call): Promise<void>
  saveTranscript(callId: string, entry: TranscriptEntry): Promise<void>
  saveLead(lead: Lead): Promise<void>
  getCall(callId: string): Promise<Call | null>
  getTranscripts(callId: string): Promise<TranscriptEntry[]>
}

// ============================================================
// Composition
// ============================================================

export interface ReceptionistConfig {
  phone: PhoneProvider
  llm: LLMProvider
  /**
   * Optional in Phase 1. The default routing in createReceptionist relies on
   * the phone provider's built-in TTS (e.g. Twilio's <Say> with Polly voices).
   * Required only when the runtime serves audio URLs back to the phone provider
   * via <Play> (see Phase 1.5 docs).
   */
  tts?: TTSProvider
  /** Optional. Many phone providers have built-in STT. */
  stt?: STTProvider
  storage: StorageProvider
  /**
   * Map of language code → system prompt content.
   * Pass the prompt string directly (not a path). The user's app is
   * responsible for loading prompts from disk if they live in files.
   */
  prompts: {
    [language: string]: string
  }
  defaultLanguage?: string
}

/**
 * The composed receptionist exposes a fetch handler that any runtime
 * (Cloudflare Workers, Vercel, Node, Bun, Deno) can serve.
 */
export interface Receptionist {
  fetch(req: Request): Promise<Response>
}
