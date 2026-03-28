import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { githubFetchTestBody, githubFetchTestDesc } from '../../descriptions/review'
import { githubService } from './github.service'

const reviewApp = new Hono()

reviewApp.post('/github/fetch-test', githubFetchTestDesc, validator('json', githubFetchTestBody), async (c) => {
  const { repoUrl, expectedPaths } = c.req.valid('json')

  const data = await githubService.fetchExpectedFilesFromRepoUrl(repoUrl, expectedPaths)
  return c.json({ data })
})

export default reviewApp
