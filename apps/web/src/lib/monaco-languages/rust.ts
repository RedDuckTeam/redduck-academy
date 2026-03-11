import type { Monaco } from '@monaco-editor/react'

export const rustLanguage: Monaco['languages']['IMonarchLanguage'] = {
  defaultToken: 'invalid',
  tokenPostfix: '.rs',
  ignoreCase: false,

  keywords: [
    'as',
    'async',
    'await',
    'break',
    'const',
    'continue',
    'crate',
    'dyn',
    'else',
    'enum',
    'extern',
    'false',
    'fn',
    'for',
    'if',
    'impl',
    'in',
    'let',
    'loop',
    'match',
    'mod',
    'move',
    'mut',
    'pub',
    'ref',
    'return',
    'self',
    'Self',
    'static',
    'struct',
    'super',
    'trait',
    'true',
    'type',
    'unsafe',
    'use',
    'where',
    'while',
    'box',
    'macro_rules',
    'union',
    'static',
    'abstract',
    'become',
    'macro',
    'override',
    'priv',
    'try',
    'typeof',
    'unsized',
    'virtual',
    'yield',
  ],

  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },
      { include: '@rawStrings' },
      { include: '@comments' },
      { include: '@lifetimes' },
      { include: '@macros' },
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/[{}]/, 'delimiter.curly'],
      [/[\u005B\u005D]/, 'delimiter.square'],
      [/[()]/, 'delimiter.parenthesis'],
      [/[<>]/, 'delimiter.angle'],
      [
        /[=><!~?:&|+*/%^-]+/,
        'operator',
      ],
      [/[;,.]/, 'delimiter'],
    ],

    whitespace: [
      [/\s+/, 'white'],
    ],

    numbers: [
      [/\d+\.\d+([eE][-+]?\d+)?[fF]?/, 'number.float'],
      [/\d+[eE][-+]?\d+[fF]?/, 'number.float'],
      [/\d+[uU]?(?:[iI](?:8|16|32|64|128|size))?/, 'number'],
      [/\d+[fF]/, 'number.float'],
      [/0[xX][0-9a-fA-F]+[uU]?(?:[iI](?:8|16|32|64|128|size))?/, 'number.hex'],
      [/0[oO][0-7]+[uU]?(?:[iI](?:8|16|32|64|128|size))?/, 'number.octal'],
      [/0[bB][01]+[uU]?(?:[iI](?:8|16|32|64|128|size))?/, 'number.binary'],
    ],

    strings: [
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, 'string', '@stringSingle'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],

    stringSingle: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],

    rawStrings: [
      [/#*r"/, 'string', '@rawString'],
    ],

    rawString: [
      [/[^"]+/, 'string'],
      [/"/, 'string', '@pop'],
    ],

    comments: [
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
      [/\/\/.*$/, 'comment.doc'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    lifetimes: [
      [/'[a-zA-Z_]\w*/, 'keyword'],
    ],

    macros: [
      [/[a-zA-Z_]\w*!/, 'metatag'],
    ],
  },
}
