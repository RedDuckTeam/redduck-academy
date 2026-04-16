import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { formatSlug } from './hooks/formatSlug'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        const prereqId = data?.prerequisiteCourse
        if (!prereqId) return data
        const selfId = originalDoc?.id ?? data?.id
        if (!selfId) return data

        // Walk the prerequisite chain to detect cycles (max depth 10)
        let currentId = typeof prereqId === 'object' ? prereqId.id : prereqId
        for (let depth = 0; depth < 10; depth++) {
          if (String(currentId) === String(selfId)) {
            throw new APIError('Circular prerequisite detected: a course cannot depend on itself (directly or indirectly).', 400)
          }
          const course = await req.payload.findByID({ collection: 'courses', id: currentId, depth: 1 })
          const nextId = course?.prerequisiteCourse
          if (!nextId) break
          currentId = typeof nextId === 'object' ? (nextId as { id: unknown }).id : nextId
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isHidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When checked, this course is excluded from the public API and all calculations.',
      },
    },
    {
      name: 'prerequisiteCourse',
      type: 'relationship',
      relationTo: 'courses',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'This course is locked until the selected prerequisite course is fully completed. Lectures are always accessible.',
      },
    },
  ],
}
