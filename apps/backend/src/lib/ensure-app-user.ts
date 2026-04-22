import { eq } from 'drizzle-orm'
import { db } from '../db'
import { user as userTable } from '../db/auth-schema'

const ADJECTIVES = [
  'amber', 'azure', 'bold', 'brave', 'bright', 'calm', 'clever', 'cool',
  'crisp', 'dark', 'deft', 'eager', 'fast', 'fierce', 'fresh', 'glad',
  'grand', 'keen', 'kind', 'light', 'lively', 'lucky', 'meek', 'mild',
  'neat', 'noble', 'proud', 'quick', 'quiet', 'rapid', 'sharp', 'sleek',
  'smart', 'smooth', 'still', 'strong', 'swift', 'tidy', 'true', 'warm',
  'wild', 'wise',
]

const NOUNS = [
  'bear', 'bird', 'boar', 'bull', 'cat', 'crane', 'crow', 'deer',
  'dove', 'duck', 'eagle', 'elk', 'falcon', 'finch', 'fox', 'frog',
  'hawk', 'heron', 'ibis', 'jay', 'kite', 'lark', 'lion', 'lynx',
  'mink', 'mole', 'moose', 'newt', 'owl', 'panda', 'pike', 'puma',
  'raven', 'robin', 'seal', 'shark', 'stag', 'swan', 'tiger', 'toad',
  'vole', 'wolf', 'wren',
]

function generateHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(10 + Math.random() * 90)
  return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${noun.charAt(0).toUpperCase()}${noun.slice(1)}${num}`
}

async function generateUniqueUsername(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = generateHandle()
    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.username, candidate))
      .limit(1)
    if (!existing) return candidate
  }
  return generateHandle()
}

export async function ensureAppUser(privyUserId: string): Promise<{ id: string }> {
  const [existing] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.privyUserId, privyUserId))
    .limit(1)

  if (existing) return { id: existing.id }

  const username = await generateUniqueUsername()
  const id = crypto.randomUUID()

  await db.insert(userTable).values({
    id,
    name: username,
    privyUserId,
    username,
  })

  return { id }
}
