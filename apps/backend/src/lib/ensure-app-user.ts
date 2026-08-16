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

async function findByPrivyUserId(privyUserId: string): Promise<{ id: string } | undefined> {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.privyUserId, privyUserId))
    .limit(1)
  return row
}

// postgres.js surfaces a Postgres unique-violation as SQLSTATE 23505.
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === '23505'
  )
}

export async function ensureAppUser(privyUserId: string): Promise<{ id: string }> {
  const existing = await findByPrivyUserId(privyUserId)
  if (existing) return existing

  // A brand-new user's SPA fires several authenticated requests on first load;
  // over the small pool they all SELECT-miss above and race to INSERT the same
  // privyUserId (a UNIQUE column). `onConflictDoNothing` on that constraint makes
  // the insert idempotent so the losers no-op instead of raising 23505: the winner
  // returns its row, the losers re-read the committed row. The loop additionally
  // retries the separate (rare) username-uniqueness race — a collision on the
  // username UNIQUE constraint escapes the privyUserId conflict target as a thrown
  // 23505, so we regenerate a handle and try again.
  for (let attempt = 0; attempt < 5; attempt++) {
    const username = await generateUniqueUsername()
    const id = crypto.randomUUID()

    try {
      const [inserted] = await db
        .insert(userTable)
        .values({ id, name: username, privyUserId, username })
        .onConflictDoNothing({ target: userTable.privyUserId })
        .returning({ id: userTable.id })

      if (inserted) return { id: inserted.id }
    } catch (err) {
      if (!isUniqueViolation(err)) throw err
      // Username collided with a concurrent insert; try a fresh handle.
      continue
    }

    // Insert was a no-op: a concurrent request already created this privyUserId.
    const winner = await findByPrivyUserId(privyUserId)
    if (winner) return winner
  }

  throw new Error(`ensureAppUser: exhausted retries provisioning user for privyUserId ${privyUserId}`)
}
