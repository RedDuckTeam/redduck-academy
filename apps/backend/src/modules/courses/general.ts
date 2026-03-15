import { createFactory } from 'hono/factory'
import { listCoursesInfoDesc } from '../../descriptions/courses'
import { CoursesService } from '../../services/courses.service'

const factory = createFactory()

export const listCoursesInfoHandler = factory.createHandlers(listCoursesInfoDesc, async (c) => {
  const data = await CoursesService.listCoursesInfo()
  return c.json({ data })
})
