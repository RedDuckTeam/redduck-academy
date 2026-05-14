import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Courses } from './collections/Courses'
import { Modules } from './collections/Modules'
import { Lessons } from './collections/Lessons'
import { CommunityEvents } from './collections/CommunityEvents'
import { s3Storage } from '@payloadcms/storage-s3'
import { payloadTotp } from 'payload-totp'

import { rootEditorFeatures } from './editor-features'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const adminUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? ''
const allowedOrigins = (process.env.PAYLOAD_ALLOWED_ORIGINS ?? adminUrl)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export default buildConfig({
  graphQL: { disable: true },
  serverURL: adminUrl || undefined,
  cors: allowedOrigins.length > 0 ? allowedOrigins : undefined,
  csrf: allowedOrigins.length > 0 ? allowedOrigins : undefined,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Courses, Modules, Lessons, CommunityEvents],
  editor: lexicalEditor({
    features: rootEditorFeatures,
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    schemaName: 'payload',
    push: false,
    pool: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      connectionString: process.env.DATABASE_URL,
      max: 8,
      application_name: 'academy-admin',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: Boolean(process.env.R2_BUCKET),
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            const key = prefix ? `${prefix}/${filename}` : filename
            const base = process.env.R2_PUBLIC_URL ?? ''
            return `${base.replace(/\/$/, '')}/${key}`
          },
        },
      },
      bucket: process.env.R2_BUCKET ?? '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT ?? '',
        forcePathStyle: true,
      },
    }),
    payloadTotp({
      collection: 'users',
      forceSetup: true,
    }),
  ],
})
