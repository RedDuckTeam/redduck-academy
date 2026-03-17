import { postgresAdapter } from '@payloadcms/db-postgres'
import { BlocksFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Courses } from './collections/Courses'
import { Modules } from './collections/Modules'
import { Lessons } from './collections/Lessons'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Courses, Modules, Lessons],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      HeadingFeature({
        enabledHeadingSizes: ['h1', 'h2', 'h3'],
      }),
      BlocksFeature({
        blocks: [
          {
            slug: 'code',
            fields: [
              {
                name: 'language',
                type: 'select',
                defaultValue: 'typescript',
                options: [
                  { label: 'TypeScript', value: 'typescript' },
                  { label: 'JavaScript', value: 'javascript' },
                  { label: 'CSS', value: 'css' },
                  { label: 'HTML', value: 'html' },
                  { label: 'JSON', value: 'json' },
                ],
              },
              {
                name: 'code',
                type: 'code',
                required: true,
              },
            ],
          },
        ],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    schemaName: 'payload',
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  sharp,
  plugins: [],
})
