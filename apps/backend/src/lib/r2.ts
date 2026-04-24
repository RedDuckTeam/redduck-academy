import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../env'
import { AppError, GENERIC_ERROR_MESSAGE } from './errors'
import { Logger } from './logger'

const logger = new Logger('R2')

const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
  } catch (err) {
    logger.error('Delete failed', err, { key })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }
}

export async function getJsonFromR2<T>(key: string): Promise<T | null> {
  try {
    const res = await r2Client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
    const text = await res.Body?.transformToString()
    if (!text) return null
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as { name?: string } | null)?.name === 'NoSuchKey') return null
    logger.error('Get JSON failed', err, { key })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
  cacheControl = 'public, max-age=31536000',
): Promise<string> {
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      }),
    )
    return `${env.R2_PUBLIC_URL}/${key}`
  } catch (err) {
    logger.error('Upload failed', err, { key, contentType, sizeBytes: body.byteLength })
    throw new AppError(502, GENERIC_ERROR_MESSAGE)
  }
}
