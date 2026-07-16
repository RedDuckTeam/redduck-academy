#!/usr/bin/env node
// Dumps course -> module -> lesson content from the DB into the canonical
// open-source Markdown tree described in content/README.md.
//
// Source of truth is the DB (NOT the public API export, which omits hidden
// lessons, the faq field, and tags). `content` is a jsonb Lexical tree that we
// serialize to Markdown with a serializer covering every Lexical node type and format flag
// present in the corpus. This serializer mirrors apps/web/src/lib/lexical-to-markdown.ts (the
// runtime fallback); keep the two in sync when either changes.
//
//   node scripts/dump-content.mjs                      # -> content/  (local DB)
//   node scripts/dump-content.mjs --out /tmp/review    # -> review dir
//   DATABASE_URL=postgres://... node scripts/dump-content.mjs   # prod, final run
//
// Reads only. Never writes to the DB.

import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import yaml from 'yaml';
const toYaml = yaml.stringify;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.find((a) => a.startsWith('--out='));
const OUT = outArg ? outArg.slice('--out='.length) : join(ROOT, 'content');
const SCHEMA = 'payload'

// lesson id -> public path, populated in main(); used to resolve Lexical internal
// links (linkType: 'internal', which carry a doc reference, not a url).
const LESSON_PATHS = new Map();

// ---- Lexical -> Markdown (audited: covers every node type/flag in the corpus) ----

function fmtText(node) {
  let t = node.text ?? '';
  if (!t) return t;
  const f = node.format ?? 0;
  if (f & 16) t = `\`${t}\``;      // inline code
  if (f & 1) t = `**${t}**`;       // bold
  if (f & 2) t = `*${t}*`;         // italic
  return t;
}
function rawText(children = []) {
  return children
    .map((n) => (n.type === 'text' ? n.text ?? '' : n.type === 'linebreak' ? '\n' : n.children ? rawText(n.children) : n.text ?? ''))
    .join('');
}
function inline(children = []) {
  return children
    .map((n) => {
      switch (n.type) {
        case 'text':
          return fmtText(n);
        case 'linebreak':
          return '\n';
        case 'link':
        case 'autolink': {
          const f = n.fields ?? {};
          let url = f.url ?? n.url ?? '';
          // Internal links reference another document, not a URL. Resolve lessons to
          // their public path; anything unresolved is flagged (not silently emptied).
          if (!url && f.linkType === 'internal' && f.doc?.relationTo === 'lessons') {
            url = LESSON_PATHS.get(f.doc.value) ?? '';
            if (!url) console.warn(`  unresolved internal link -> lesson ${f.doc.value}`);
          }
          return `[${inline(n.children)}](${url})`;
        }
        default:
          return n.children ? inline(n.children) : n.text ?? '';
      }
    })
    .join('');
}
function listToMd(node, depth = 0) {
  const ordered = node.listType === 'number';
  const pad = '  '.repeat(depth);
  const lines = [];
  let i = 1;
  for (const item of node.children ?? []) {
    if (item.type !== 'listitem') continue;
    const nested = (item.children ?? []).filter((c) => c.type === 'list');
    const own = (item.children ?? []).filter((c) => c.type !== 'list');
    const marker = ordered ? `${i}.` : '-';
    if (own.length || !nested.length) {
      lines.push(`${pad}${marker} ${inline(own)}`.trimEnd());
      i++;
    }
    for (const sub of nested) lines.push(listToMd(sub, depth + 1));
  }
  return lines.join('\n');
}
function tableToMd(node) {
  const rows = (node.children ?? []).filter((r) => r.type === 'tablerow');
  const out = [];
  rows.forEach((row, idx) => {
    const cells = (row.children ?? [])
      .filter((c) => c.type === 'tablecell')
      .map((c) => inline((c.children ?? []).flatMap((p) => p.children ?? [])).replace(/\n/g, ' ').trim());
    out.push(`| ${cells.join(' | ')} |`);
    if (idx === 0) out.push(`| ${cells.map(() => '---').join(' | ')} |`);
  });
  return out.join('\n');
}
function blockToMd(node) {
  const parts = [];
  for (const child of node.children ?? []) {
    switch (child.type) {
      case 'heading': {
        const level = Number(child.tag?.replace('h', '')) || 2;
        parts.push(`${'#'.repeat(level)} ${inline(child.children)}`);
        break;
      }
      case 'paragraph': {
        const raw = rawText(child.children);
        if (raw.trimStart().startsWith('<svg')) { parts.push(raw.trim()); break; }
        const text = inline(child.children).trim();
        if (text) parts.push(text);
        break;
      }
      case 'quote':
        parts.push(inline(child.children).split('\n').map((l) => `> ${l}`).join('\n'));
        break;
      case 'list':
        parts.push(listToMd(child));
        break;
      case 'table':
        parts.push(tableToMd(child));
        break;
      case 'block': {
        const f = child.fields ?? {};
        if (f.blockType === 'code') {
          parts.push('```' + (f.language && f.language !== 'plain' ? f.language : '') + '\n' + (f.code ?? '') + '\n```');
        }
        break;
      }
      default:
        if (child.children) parts.push(blockToMd(child));
    }
  }
  return parts.join('\n\n');
}
function lexicalToMd(content) {
  if (!content?.root) return '';
  let md = blockToMd(content.root).trim();
  // Give the very long plgrnd.io share links a clean label.
  md = md.replace(/\[https?:\/\/plgrnd\.io[^\]]*\]\((https?:\/\/plgrnd\.io[^)]*)\)/gi, '[interactive playground]($1)');
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

// ---- File emission ----

function frontmatter(obj) {
  // toYaml preserves insertion order; drop undefined keys beforehand.
  const clean = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
  return `---\n${toYaml(clean)}---\n`;
}

async function writeFileAt(path, body) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, 'utf8');
}

async function main() {
  const client = new pg.Client(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : { database: 'academy', host: process.env.PGHOST || '/tmp' },
  );
  await client.connect();

  const q = (sql) => client.query(sql).then((r) => r.rows);
  const courses = await q(`select id, title, slug, "order", is_hidden, description from ${SCHEMA}.courses order by "order", id`);
  const modules = await q(`select id, title, slug, "order", is_hidden, course_id from ${SCHEMA}.modules order by "order", id`);
  const lessons = await q(`select id, title, slug, "order", type, is_hidden, module_id, content from ${SCHEMA}.lessons order by "order", id`);
  const faqRows = await q(`select _parent_id, _order, question, answer from ${SCHEMA}.lessons_faq order by _parent_id, _order`);
  await client.end();

  const faqByLesson = new Map();
  for (const r of faqRows) {
    if (!faqByLesson.has(r._parent_id)) faqByLesson.set(r._parent_id, []);
    faqByLesson.get(r._parent_id).push({ question: r.question, answer: r.answer });
  }
  const modulesByCourse = new Map();
  for (const m of modules) {
    if (!modulesByCourse.has(m.course_id)) modulesByCourse.set(m.course_id, []);
    modulesByCourse.get(m.course_id).push(m);
  }
  const lessonsByModule = new Map();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
    lessonsByModule.get(l.module_id).push(l);
  }

  // Map every lesson id to its public path so internal links resolve (see inline()).
  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const courseById = new Map(courses.map((c) => [c.id, c]));
  for (const l of lessons) {
    const m = moduleById.get(l.module_id);
    const c = m && courseById.get(m.course_id);
    if (m && c) LESSON_PATHS.set(l.id, `/courses/${c.slug}/${m.slug}/${l.slug}`);
  }

  // Clear previously generated content, but keep the hand-maintained docs the validator skips
  // (content/README.md and content/TEMPLATE.md).
  const KEEP_FILES = new Set(['README.md', 'TEMPLATE.md']);
  try {
    for (const name of await readdir(OUT)) {
      if (KEEP_FILES.has(name)) continue;
      await rm(join(OUT, name), { recursive: true, force: true });
    }
  } catch { /* OUT does not exist yet */ }

  // File/dir names are pure slugs so the path mirrors the lesson route
  // (/courses/<course>/<module>/<lesson>); `order` lives in frontmatter.
  let nc = 0, nm = 0, nl = 0, withFaq = 0, emptyBody = 0;
  for (const c of courses) {
    const cDir = join(OUT, c.slug);
    const cFm = frontmatter({ id: c.id, title: c.title, order: Number(c.order), isHidden: c.is_hidden || undefined });
    await writeFileAt(join(cDir, '_course.md'), cFm + (c.description ? `\n${c.description.trim()}\n` : ''));
    nc++;

    for (const m of modulesByCourse.get(c.id) ?? []) {
      const mDir = join(cDir, m.slug);
      const mFm = frontmatter({ id: m.id, title: m.title, order: Number(m.order), isHidden: m.is_hidden || undefined });
      await writeFileAt(join(mDir, '_module.md'), mFm);
      nm++;

      for (const l of lessonsByModule.get(m.id) ?? []) {
        const faq = faqByLesson.get(l.id);
        if (faq) withFaq++;
        const fm = frontmatter({
          id: l.id,
          title: l.title,
          type: l.type,
          order: Number(l.order),
          isHidden: l.is_hidden || undefined,
          faq: faq || undefined,
        });
        const body = lexicalToMd(l.content);
        if (!body) emptyBody++;
        await writeFileAt(join(mDir, `${l.slug}.md`), fm + (body ? `\n${body}\n` : ''));
        nl++;
      }
    }
  }

  console.log(`Wrote ${nc} courses, ${nm} modules, ${nl} lessons to ${OUT}`);
  console.log(`  lessons with faq: ${withFaq}   empty-body lessons: ${emptyBody}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
