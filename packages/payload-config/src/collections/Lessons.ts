import type { CollectionConfig } from 'payload'

import { formatSlug } from './hooks/formatSlug'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.type === 'test' && Array.isArray(data.questions)) {
          const maxPoints = data.questions.reduce(
            (sum: number, q: { points?: number }) => sum + (q.points ?? 0),
            0,
          )
          data.maxPoints = maxPoints
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
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
      index: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Lecture', value: 'lecture' },
        { label: 'Test', value: 'test' },
        { label: 'Coding Task', value: 'coding_task' },
        { label: 'Review Task', value: 'review_task' },
      ],
      defaultValue: 'lecture',
    },
    {
      name: 'content',
      type: 'richText',
    },
    // --------------------------------------------------------------------------
    // Test Fields
    {
      name: 'questions',
      type: 'array',
      admin: {
        condition: (data) => data?.type === 'test',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        {
          name: 'points',
          type: 'number',
          defaultValue: 5,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'isCorrect',
              type: 'checkbox',
              defaultValue: false,
              access: {
                read: ({ req: { user } }) => Boolean(user),
              }
            }
          ]
        },
      ]
    },
    // --------------------------------------------------------------------------
    // Review Task Fields
    {
      name: 'maxPoints',
      type: 'number',
      defaultValue: 0,
      admin: {
        condition: (data) =>
          data?.type === 'coding_task' ||
          data?.type === 'review_task' ||
          data?.type === 'test',
        description:
          'For tests: auto-computed from question points. For coding/review tasks: enter manually.',
      },
    },
  ],
}
