import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  username: text('username').unique(),
  blacklisted: boolean('blacklisted').default(false).notNull(),
  skipPrerequisites: boolean('skip_prerequisites').default(false).notNull(),
  isPrivate: boolean('is_private').default(true).notNull(),
  bio: text('bio'),
  privyUserId: text('privy_user_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
