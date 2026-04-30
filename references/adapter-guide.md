# Adapter Authoring Guide

This guide explains how to add a new provider adapter to VoiceForge.

## The contract

Every adapter implements one of the interfaces in `core/interfaces.ts`:

- `PhoneProvider`
- `LLMProvider`
- `TTSProvider`
- `STTProvider`
- `StorageProvider`

You do not need to implement multiple interfaces in one adapter. Keep it focused.

## Directory layout

```
adapters/
├── <layer>/                  # phone | llm | tts | stt | storage | runtime | framework
│   └── <provider>/
│       ├── index.ts          # The adapter export
│       ├── README.md         # Config, env vars, limitations, links
│       └── types.ts          # (optional) Provider-specific types not in core
```

## Adapter shape

An adapter is a factory function that takes config and returns an interface implementation.

```ts
// adapters/llm/openai/index.ts
import type { LLMProvider, Message, Tool, LLMResponse } from '../../../core/interfaces'

export interface OpenAIConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export function openai(config: OpenAIConfig): LLMProvider {
  return {
    async reason({ messages, system, tools, maxTokens }) {
      // Call OpenAI API, map the response to LLMResponse shape
      // ...
      return { content: '...', toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }
    },
  }
}
```

## Rules

1. **Adapter takes config, returns interface.** No global state, no singletons.
2. **No env-var reading inside the adapter.** The user's app reads env, the adapter takes plain values.
3. **Map provider-specific concepts to core types.** OpenAI's `tool_calls` becomes our `toolCalls`. Twilio's TwiML becomes our `Response`.
4. **Throw early on misconfiguration.** Don't fail silently on bad API keys.
5. **Document streaming behavior.** If the adapter supports streaming, expose it through `AudioStream`. If not, document the limitation in the README.

## README template

Every adapter README should include:

```markdown
# <Provider> <Layer> Adapter

Implements: `<InterfaceName>` from `core/interfaces.ts`.

## Configuration

\`\`\`ts
import { providerName } from 'voiceforge/adapters/<layer>/<provider>'

const adapter = providerName({
  apiKey: 'sk-...',
  model: '...',
})
\`\`\`

## Required environment variables

- `PROVIDER_API_KEY` — get one at <link>
- `PROVIDER_OTHER_VAR` — purpose

## Supported features

- ✅ Streaming
- ✅ Tool use
- ❌ Real-time interruption (not yet)

## Limitations

- Max audio length: X seconds
- Pricing: $X per 1M tokens at time of writing

## Links

- Provider docs: <url>
- Pricing: <url>
- Status page: <url>
```

## Testing

Add a manual smoke test in `adapters/<layer>/<provider>/test.mjs` that:

1. Reads required env vars
2. Calls the adapter with a real input
3. Logs the response

This isn't a CI test — it's a quick way for contributors to verify an adapter works without spinning up the full receptionist.

## Pull request checklist

- [ ] Implementation in `adapters/<layer>/<provider>/index.ts`
- [ ] README with config, env, features, limitations
- [ ] Manual smoke test that runs against the real provider
- [ ] Updated `ARCHITECTURE.md` status table to mark the adapter as Phase 1 or Phase 2
- [ ] No `env.X` reads inside the adapter — config takes plain values

## Naming conventions

- Function name: lowercase provider name, no prefix. `twilio()`, `anthropic()`, `elevenlabs()`.
- Config interface: PascalCase + `Config` suffix. `TwilioConfig`, `AnthropicConfig`.
- Directory: lowercase, hyphenated if multi-word. `cloudflare-workers`, `eleven-labs` (no — single word preferred, see Twilio).
