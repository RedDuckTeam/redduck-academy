'use server'

import type { SerializedEditorState } from 'lexical'
import type { Field, RichTextField } from 'payload'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'

import config from '@payload-config'

function findLessonsContentField(fields: Field[]): RichTextField | null {
  for (const field of fields) {
    if ('name' in field && field.name === 'content' && field.type === 'richText') {
      return field as RichTextField
    }
  }
  return null
}

async function getContentEditorConfig() {
  // @ts-expect-error - getPayload is not typed
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) {
    throw new Error('Unauthorized')
  }

  const lessons = payload.config.collections.find((c) => c.slug === 'lessons')
  const contentField = lessons ? findLessonsContentField(lessons.fields) : null

  return contentField
    ? editorConfigFactory.fromField({ field: contentField })
    : await editorConfigFactory.default({ config: payload.config })
}

export async function lexicalToMarkdownAction(data: SerializedEditorState | null): Promise<string> {
  if (!data) return ''
  const editorConfig = await getContentEditorConfig()
  return convertLexicalToMarkdown({ data, editorConfig })
}

export async function markdownToLexicalAction(markdown: string): Promise<SerializedEditorState> {
  const editorConfig = await getContentEditorConfig()
  return convertMarkdownToLexical({ editorConfig, markdown }) as SerializedEditorState
}
