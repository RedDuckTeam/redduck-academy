import { z } from 'zod'
import { learnerCodingTaskSubmissionSchema, learnerProjectSubmissionSchema } from '../review/submissions'

export const completedLessonSchema = z.object({
  courseSlug: z.string(),
  lessonId: z.number(),
  lessonSlug: z.string(),
})

export const userStatsSchema = z.object({
  completedLessonsCount: z.number(),
})

export const progressCardsSchema = z.object({
  completedLessonsCount: z.number(),
  completedCoursesCount: z.number(),
  totalCoursesCount: z.number(),
  currentStreak: z.number(),
  placeInRanking: z.number(),
})

export const userRatingItemSchema = z.object({
  rank: z.number(),
  userId: z.string(),
  userName: z.string(),
  username: z.string().nullable(),
  completedLessonsCount: z.number(),
  completedCoursesCount: z.number(),
})

export const userSettingsSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  skipPrerequisites: z.boolean(),
  isPrivate: z.boolean(),
  bio: z.string().nullable(),
  name: z.string(),
  image: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  blacklisted: z.boolean(),
  createdAt: z.string(),
})

const userCertificateSummarySchema = z.object({
  id: z.string(),
  courseSlug: z.string(),
  courseTitle: z.string(),
  issuedAt: z.string(),
  name: z.string(),
  status: z.enum(['created', 'requested', 'claimed']),
  metadataUri: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tokenId: z.string().nullable(),
  txHash: z.string().nullable(),
})

export const publicProfileSchema = z.discriminatedUnion('isPrivate', [
  z.object({
    username: z.string(),
    isPrivate: z.literal(true),
  }),
  z.object({
    username: z.string(),
    isPrivate: z.literal(false),
    name: z.string(),
    bio: z.string().nullable(),
    image: z.string().nullable(),
    rank: z.number(),
    completedLessonsCount: z.number(),
    certificates: z.array(userCertificateSummarySchema),
  }),
])

export const updateUserNameResponseDataSchema = z.object({ name: z.string() })
export const updateUserBioResponseDataSchema = z.object({ bio: z.string().nullable() })
export const updateUserUsernameResponseDataSchema = z.object({ username: z.string() })
export const uploadAvatarResponseDataSchema = z.object({ imageUrl: z.string().nullable() })
export const updateUserSettingsResponseDataSchema = z.object({
  skipPrerequisites: z.boolean(),
  isPrivate: z.boolean(),
})

/**
 * Submissions overlay attached to a `GET /api/user/lessons/...` response when the
 * lesson is review_task or coding_task. Lesson body fields are typed elsewhere
 * (Payload-derived) — only the leak-prone arrays are schema-enforced here.
 */
export const learnerLessonSubmissionsSchema = z.union([
  z.array(learnerProjectSubmissionSchema),
  z.array(learnerCodingTaskSubmissionSchema),
])

export const userLessonProgressOverlaySchema = z.object({
  userAnswers: z.record(z.string(), z.array(z.string())).nullable(),
  isCompleted: z.boolean(),
  correctAnswers: z.record(z.string(), z.array(z.string())).nullable(),
  submissions: learnerLessonSubmissionsSchema.optional(),
})

export type CompletedLesson = z.infer<typeof completedLessonSchema>
export type UserStats = z.infer<typeof userStatsSchema>
export type ProgressCards = z.infer<typeof progressCardsSchema>
export type UserRatingItem = z.infer<typeof userRatingItemSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>
export type PublicProfile = z.infer<typeof publicProfileSchema>
export type UserLessonProgressOverlay = z.infer<typeof userLessonProgressOverlaySchema>
