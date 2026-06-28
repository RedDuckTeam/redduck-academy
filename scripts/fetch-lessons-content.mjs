#!/usr/bin/env node
// Fetches every course -> module -> lesson and stores each lesson's full JSON
// response under /content/{course}/{module}/{lesson}.json
//
// Usage: node scripts/fetch-lessons-content.mjs
// Optional env: API_BASE (defaults to the prod backend)

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.API_BASE ?? 'https://academy-backend.redduck.io/api';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');

// Turn a human title into a safe folder/file name. Falls back to the slug.
function sanitize(name) {
  return name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')   // drop punctuation
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  const body = await res.json();
  return body.data;
}

async function main() {
  console.log(`Fetching courses from ${API_BASE}/courses`);
  const courses = await getJson(`${API_BASE}/courses`);
  console.log(`Found ${courses.length} course(s)\n`);

  let saved = 0;
  let failed = 0;

  for (const course of courses) {
    const courseDir = `${String(course.order).padStart(2, '0')}-${sanitize(course.title)}`;
    const modules = course.modules ?? [];

    for (const mod of modules) {
      const moduleDir = `${String(mod.order).padStart(2, '0')}-${sanitize(mod.title)}`;
      const lessons = mod.lessons ?? [];

      for (const lesson of lessons) {
        const fileName = `${String(lesson.order).padStart(2, '0')}-${sanitize(lesson.title)}.json`;
        const outPath = join(ROOT, courseDir, moduleDir, fileName);
        const url = `${API_BASE}/lessons/${course.slug}/${lesson.slug}`;

        try {
          const data = await getJson(url);
          await mkdir(dirname(outPath), { recursive: true });
          await writeFile(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
          saved++;
          console.log(`  ✓ ${course.slug}/${lesson.slug}`);
        } catch (err) {
          failed++;
          console.error(`  ✗ ${course.slug}/${lesson.slug} — ${err.message}`);
        }
      }
    }
  }

  console.log(`\nDone. Saved ${saved} lesson(s)${failed ? `, ${failed} failed` : ''}.`);
  console.log(`Output: ${ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
