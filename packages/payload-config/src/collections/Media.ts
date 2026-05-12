import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Payload doc endpoint is locked to authenticated users. The underlying file on R2 is
    // still publicly readable via R2_PUBLIC_URL — that's what the frontend uses for <img src=…>.
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
