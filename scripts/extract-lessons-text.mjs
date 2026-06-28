#!/usr/bin/env node
// Reads the lesson JSON saved by fetch-lessons-content.mjs and renders each
// lesson's user-facing text to readable Markdown for typo / proofreading.
//
// Lesson `content` (and test question/option text) is Lexical rich-text JSON.
// We walk the Lexical tree and emit Markdown. Code blocks are fenced so a
// proofreader can skip them. Diagrams (raw <svg> markup) and interactive
// playground (plgrnd.io) links are preserved so the export stays renderable.
//
// Usage: node scripts/extract-lessons-text.mjs
// Input:  content/**/*.json
// Output: content-md/**/*.md  (mirrors the input tree)

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'content');
const OUT = join(ROOT, 'content-md');

// ---- Lexical -> Markdown ---------------------------------------------------

// Apply inline text formatting (Lexical packs flags into a bitmask).
function fmtText(node) {
  let t = node.text ?? '';
  if (!t) return t;
  const f = node.format ?? 0;
  if (f & 16) t = `\`${t}\``;      // code
  if (f & 1) t = `**${t}**`;       // bold
  if (f & 2) t = `*${t}*`;         // italic
  return t;
}

// Concatenate raw text without applying Markdown formatting. Used to
// reconstruct diagram markup (raw <svg>) that is fragmented across text nodes.
function rawText(children = []) {
  return children
    .map((n) => {
      if (n.type === 'text') return n.text ?? '';
      if (n.type === 'linebreak') return '\n';
      return n.children ? rawText(n.children) : (n.text ?? '');
    })
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
          const url = n.fields?.url ?? n.url ?? '';
          return `[${inline(n.children)}](${url})`;
        }
        default:
          // Unknown inline node — fall back to its text children.
          return n.children ? inline(n.children) : (n.text ?? '');
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
    // A listitem may contain a nested list instead of text.
    const nested = (item.children ?? []).filter((c) => c.type === 'list');
    const ownChildren = (item.children ?? []).filter((c) => c.type !== 'list');
    const marker = ordered ? `${i}.` : '-';
    if (ownChildren.length || !nested.length) {
      lines.push(`${pad}${marker} ${inline(ownChildren)}`.trimEnd());
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
        // Diagrams are stored as raw <svg> markup fragmented across text nodes.
        // Preserve them verbatim so the diagram still renders.
        const raw = rawText(child.children);
        if (raw.trimStart().startsWith('<svg')) {
          parts.push(raw.trim());
          break;
        }
        const text = inline(child.children).trim();
        if (text) parts.push(text);
        break;
      }
      case 'quote':
        parts.push(
          inline(child.children)
            .split('\n')
            .map((l) => `> ${l}`)
            .join('\n'),
        );
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
  return blockToMd(content.root).trim();
}

// ---- Per-lesson rendering --------------------------------------------------

function renderLesson(d) {
  const out = [`# ${d.title}`, '', `_type: ${d.type}_`, ''];

  const body = lexicalToMd(d.content);
  if (body) out.push(body, '');

  // Test questions + answer options are user-facing prose too.
  if (Array.isArray(d.questions) && d.questions.length) {
    out.push('---', '', '## Questions', '');
    d.questions.forEach((q, i) => {
      out.push(`### Q${i + 1}`, '', lexicalToMd(q.question), '');
      (q.options ?? []).forEach((opt, j) => {
        const label = lexicalToMd(opt.label).replace(/\n+/g, ' ').trim();
        out.push(`${String.fromCharCode(97 + j)}. ${label}`);
      });
      out.push('');
    });
  }

  // Review-task rubric items, when present.
  if (Array.isArray(d.reviewGradingTasks) && d.reviewGradingTasks.length) {
    out.push('---', '', '## Review grading tasks', '');
    d.reviewGradingTasks.forEach((t, i) => {
      const desc = t.description ? lexicalToMd(t.description) : (t.task ?? t.title ?? '');
      out.push(`${i + 1}. ${typeof desc === 'string' ? desc : JSON.stringify(desc)}`);
    });
    out.push('');
  }

  let text = out.join('\n');

  // The interactive-playground share links use the full (very long) URL as
  // their own link text. Give them a clean label while keeping the URL intact.
  text = text.replace(/\[https?:\/\/plgrnd\.io[^\]]*\]\((https?:\/\/plgrnd\.io[^)]*)\)/gi, '[interactive playground]($1)');

  return text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ---- Walk the tree ---------------------------------------------------------

async function jsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await jsonFiles(p)));
    else if (e.name.endsWith('.json')) files.push(p);
  }
  return files;
}

async function main() {
  const files = (await jsonFiles(SRC)).sort();
  let count = 0;
  for (const file of files) {
    const data = JSON.parse(await readFile(file, 'utf8'));
    const md = renderLesson(data);
    const outPath = join(OUT, relative(SRC, file)).replace(/\.json$/, '.md');
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, md, 'utf8');
    count++;
  }
  console.log(`Extracted ${count} lesson(s) to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
