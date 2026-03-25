import { describeRoute, resolver } from 'hono-openapi'
import { z } from 'zod'
import { errorSchema } from './schemas'

const githubFetchTestBodySchema = z.object({
  repoUrl: z.string().url().describe('GitHub repository URL (may include /tree/, /blob/, or /commit/)'),
  expectedPaths: z
    .array(z.string().min(1))
    .min(1)
    .describe('File paths in the repo to fetch, e.g. README.md'),
})

const githubFetchTestResponseSchema = z.object({
  data: z.object({
    owner: z.string(),
    repo: z.string(),
    commitSha: z.string(),
    resolvedRef: z.string(),
    fileTreePaths: z.array(z.string()),
    files: z.array(
      z.object({
        path: z.string(),
        content: z.string(),
      }),
    ),
    missingPaths: z.array(z.string()),
    oversizedPaths: z.array(
      z.object({
        path: z.string(),
        sizeBytes: z.number(),
      }),
    ),
  }),
})

export const githubFetchTestDesc = describeRoute({
  summary: '[Dev] Fetch files from a GitHub repo',
  description:
    'Resolves the ref from the URL, lists the tree, and returns contents for the given paths. For manual testing of GitHubService.',
  tags: ['Review'],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: resolver(githubFetchTestBodySchema),
      },
    },
  },
  responses: {
    200: {
      description: 'Repo metadata, tree paths, file contents, and any missing paths',
      content: {
        'application/json': {
          schema: resolver(githubFetchTestResponseSchema),
        },
      },
    },
    400: {
      description: 'Invalid URL or GitHub client error',
      content: { 'application/json': { schema: errorSchema } },
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const githubFetchTestBody = githubFetchTestBodySchema
