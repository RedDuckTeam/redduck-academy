import type { CollectionConfig } from 'payload'
import { formatSlug } from './hooks/formatSlug'

export const Courses: CollectionConfig = {
  slug: 'courses',
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
  ],
}
