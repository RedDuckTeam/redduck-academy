'use server'

import type { SerializedEditorState } from 'lexical'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'

import config from '@payload-config'

export async function lexicalToMarkdownAction(data: SerializedEditorState | null): Promise<string> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!data) return ''

  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  return convertLexicalToMarkdown({ data, editorConfig })
}
