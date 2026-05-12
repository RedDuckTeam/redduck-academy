import type { CollectionConfig } from 'payload'

import { formatSlug } from './hooks/formatSlug'

export const CommunityEvents: CollectionConfig = {
  slug: 'community-events',
  admin: {
    useAsTitle: 'title',
    group: 'Community',
    defaultColumns: ['title', 'eventDate', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
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
      index: true,
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
      required: true,
    },
    {
      name: 'eventDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
  ],
}
