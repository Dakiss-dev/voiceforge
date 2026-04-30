# Anthropic LLM Adapter

**Status:** Phase 1, in progress

Implements: `LLMProvider` from `core/interfaces.ts`.

Anthropic Claude is the reference LLM-provider adapter. Default model: `claude-sonnet-4-6`.

## Will support (Phase 1)

- Reasoning with system prompt + message history
- Tool use (function calling)
- Token usage reporting

## Phase 2

- Prompt caching for the system prompt + business context
- Streaming responses
- Extended thinking for complex reasoning

## Required environment

- `ANTHROPIC_API_KEY`

## Links

- Anthropic docs: https://docs.anthropic.com/
- API reference: https://docs.anthropic.com/en/api/getting-started
- Pricing: https://www.anthropic.com/pricing
