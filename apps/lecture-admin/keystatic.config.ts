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
        courses: collection({
          label: 'Courses',
          slugField: 'title',
          path: 'content/courses/*',
          format: { contentField: 'description' },
          schema: {
            title: fields.slug({ name: { label: 'Course Title' } }),
            description: fields.mdx({ label: 'Course Description' }),
            
            modules: fields.array(
              fields.object({
                title: fields.text({ label: 'Module Title' }),
                
                lessons: fields.array(
                  fields.object({
                    title: fields.text({ label: 'Lesson Title' }),
                    content: fields.mdx({ label: 'Lesson Content' }),
                    links: fields.array(
                      fields.object({
                        title: fields.text({ label: 'Link Title' }),
                        url: fields.url({ label: 'URL' }),
                      }),
                      {
                        label: 'Links',
                        itemLabel: (props) => props.fields.title.value || 'New Link',
                      }
                    ),
                  }),
                  {
                    label: 'Lessons',
                    itemLabel: (props) => props.fields.title.value || 'New Lesson',
                  }
                ),
              }),
              {
                label: 'Modules',
                itemLabel: (props) => props.fields.title.value || 'New Module',
              }
            ),
          },
        }),
      },
});