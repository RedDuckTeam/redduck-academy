import { config, fields, collection } from '@keystatic/core';

const isProd = process.env.NODE_ENV === 'production';
export default config({
  storage: isProd
    ? {
        kind: 'github',
        repo: 'RedDuck-Software/redduck-academy',
      }
    : {
        kind: 'local',
      },
  collections: {
    lectures: collection({
      label: 'Lectures',
      slugField: 'title',
      path: isProd 
        ? 'apps/web/content/lectures/*' 
        : 'content/lectures/*', 
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});