import { z } from 'zod'

export const updateUserNameBodySchema = z.object({
  name: z.string().min(1).max(35).regex(/^[\w\s\-.'@!#$%^&*()+=[\]{};:,<>?/\\|~`"]+$/, 'Invalid name'),
})

export const updateUserBioBodySchema = z.object({
  bio: z.string().max(300).nullable(),
})

export const updateUserUsernameBodySchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

export const usernameParamSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

export const updateUserSettingsBodySchema = z.object({
  skipPrerequisites: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

export type UpdateUserNameBody = z.infer<typeof updateUserNameBodySchema>
export type UpdateUserBioBody = z.infer<typeof updateUserBioBodySchema>
export type UpdateUserUsernameBody = z.infer<typeof updateUserUsernameBodySchema>
export type UsernameParam = z.infer<typeof usernameParamSchema>
export type UpdateUserSettingsBody = z.infer<typeof updateUserSettingsBodySchema>
