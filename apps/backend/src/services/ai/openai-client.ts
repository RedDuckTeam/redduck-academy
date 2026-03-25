import OpenAI from 'openai'
import type { AiClient, ChatParams, ChatResult } from './types'
import { ChatModel } from 'openai/resources/chat/chat.mjs'
export const DEFAULT_MODEL: ChatModel = 'gpt-4.1'

export class OpenAiAiClient implements AiClient {
  private readonly client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    const { messages, responseFormat = 'text' } = params
    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    return { text }
  }
}
