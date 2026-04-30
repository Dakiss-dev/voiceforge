/**
 * Anthropic LLM Adapter
 *
 * Implements LLMProvider using Anthropic's Claude API. Default model is
 * claude-sonnet-4-5; override via config.model. Supports tool use.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider, LLMResponse } from '../../../core/interfaces'

export interface AnthropicConfig {
  apiKey: string
  /** Model ID. Default: "claude-sonnet-4-5". */
  model?: string
  /** Override base URL (for proxies, gateways, or self-hosted). */
  baseUrl?: string
}

export function anthropic(config: AnthropicConfig): LLMProvider {
  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  const model = config.model || 'claude-sonnet-4-5'

  return {
    async reason({ messages, system, tools, maxTokens }) {
      const anthropicMessages = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      // If we have no messages, Anthropic API will reject. Add a placeholder.
      if (anthropicMessages.length === 0) {
        anthropicMessages.push({ role: 'user', content: '(début de l\'appel)' })
      }

      const anthropicTools = tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
      }))

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens ?? 1024,
        system,
        messages: anthropicMessages,
        ...(anthropicTools ? { tools: anthropicTools } : {}),
      })

      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      )
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      )

      const text = textBlocks.map((b) => b.text).join('\n').trim()
      const toolCalls = toolUseBlocks.map((b) => ({
        name: b.name,
        input: b.input,
      }))

      const result: LLMResponse = {
        content: text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }

      if (toolCalls.length > 0) {
        result.toolCalls = toolCalls
      }

      return result
    },
  }
}
