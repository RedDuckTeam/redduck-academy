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
    // --------------------------------------------------------------------------
    // Lecture Fields
    {
      name: 'content',
      type: 'richText',
      admin: {
        condition: (data) => {
          if (!data?.type) return true;
          return data.type === 'lecture';
        },
      },
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
    // Coding Task Fields
    {
      name: 'description',
      type: 'richText',
      admin: {
        condition: (data) => data?.type === 'coding_task',
      },
    },
    {
      name: 'language',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'coding_task',
      },
    },
    {
      name: 'boilerplate',
      type: 'code',
      admin: {
        condition: (data) => data?.type === 'coding_task',
      },
    },
    {
      name: 'testSuite',
      type: 'code',
      admin: {
        condition: (data) => data?.type === 'coding_task',
      },
    },
    // --------------------------------------------------------------------------
    // Review Task Fields
    {
      name: 'reviewDescription',
      type: 'richText',
      admin: {
        condition: (data) => data?.type === 'review_task',
      },
    },
    {
      name: 'rubric',
      type: 'textarea',
      admin: {
        condition: (data) => data?.type === 'review_task',
      },
    },
    {
      name: 'maxScore',
      type: 'number',
      defaultValue: 100,
      admin: {
        condition: (data) => data?.type === 'review_task',
      },
    },
  ],
}
