export type ChatMessageRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatMessageRole
  content: string
}

export type ChatResponseFormat = 'text' | 'json_object'

export interface ChatParams {
  messages: ChatMessage[]
  responseFormat?: ChatResponseFormat
}

export interface ChatResult {
  text: string
}

export interface AiClient {
  chat(params: ChatParams): Promise<ChatResult>
}
