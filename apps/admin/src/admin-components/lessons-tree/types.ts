export type LessonType = 'lecture' | 'test' | 'coding_task' | 'review_task'

export type TreeMode = 'courses' | 'modules' | 'lessons'

export interface CourseNode {
  id: number
  title: string
  isHidden: boolean
  order: number
}

export interface ModuleNode {
  id: number
  title: string
  courseId: number
  isHidden: boolean
  order: number
}

export interface LessonNode {
  id: number
  title: string
  moduleId: number
  type: LessonType
  isHidden: boolean
  order: number
}
