/**
 * Supabase Storage Adapter
 *
 * Implements StorageProvider using Supabase JS client. Reads/writes the
 * canonical schema from templates/supabase/migrations/0001_calls_schema.sql.
 *
 * Use the SERVICE_ROLE_KEY for server-side writes. NEVER expose this key
 * to client-side code.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  StorageProvider,
  Call,
  TranscriptEntry,
  Lead,
  Role,
  CallStatus,
} from '../../../core/interfaces'

export interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

interface CallRow {
  id: string
  twilio_call_sid: string
  caller_number: string
  business_number: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  status: string
  language: string
  metadata: Record<string, unknown>
}

interface TranscriptRow {
  id: string
  call_id: string
  role: string
  content: string
  ts: string
}

export function supabase(config: SupabaseConfig): StorageProvider {
  const client: SupabaseClient = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  })

  return {
    async saveCall(call: Call) {
      const row: Partial<CallRow> = {
        id: call.id,
        twilio_call_sid: call.providerCallSid,
        caller_number: call.callerNumber,
        business_number: call.businessNumber,
        started_at: call.startedAt.toISOString(),
        ended_at: call.endedAt?.toISOString() ?? null,
        duration_seconds: call.durationSeconds ?? null,
        status: call.status,
        language: call.language,
        metadata: call.metadata || {},
      }
      const { error } = await client.from('calls').upsert(row)
      if (error) {
        throw new Error(`[supabase] saveCall failed: ${error.message}`)
      }
    },

    async saveTranscript(callId: string, entry: TranscriptEntry) {
      const { error } = await client.from('transcripts').insert({
        call_id: callId,
        role: entry.role,
        content: entry.content,
        ts: entry.ts.toISOString(),
      })
      if (error) {
        throw new Error(`[supabase] saveTranscript failed: ${error.message}`)
      }
    },

    async saveLead(lead: Lead) {
      const { error } = await client.from('leads').insert({
        call_id: lead.callId,
        name: lead.name ?? null,
        phone: lead.phone ?? null,
        email: lead.email ?? null,
        intent: lead.intent ?? null,
        notes: lead.notes ?? null,
      })
      if (error) {
        throw new Error(`[supabase] saveLead failed: ${error.message}`)
      }
    },

    async getCall(callId: string) {
      const { data, error } = await client
        .from('calls')
        .select('*')
        .eq('id', callId)
        .maybeSingle()

      if (error) {
        throw new Error(`[supabase] getCall failed: ${error.message}`)
      }
      if (!data) return null

      return rowToCall(data as CallRow)
    },

    async getTranscripts(callId: string) {
      const { data, error } = await client
        .from('transcripts')
        .select('*')
        .eq('call_id', callId)
        .order('ts', { ascending: true })

      if (error) {
        throw new Error(`[supabase] getTranscripts failed: ${error.message}`)
      }
      if (!data) return []

      return (data as TranscriptRow[]).map(rowToTranscript)
    },
  }
}

function rowToCall(row: CallRow): Call {
  return {
    id: row.id,
    providerCallSid: row.twilio_call_sid,
    callerNumber: row.caller_number,
    businessNumber: row.business_number,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    status: row.status as CallStatus,
    language: row.language,
    metadata: row.metadata,
  }
}

function rowToTranscript(row: TranscriptRow): TranscriptEntry {
  return {
    role: row.role as Role,
    content: row.content,
    ts: new Date(row.ts),
  }
}
