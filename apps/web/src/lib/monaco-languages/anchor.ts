import type { Monaco } from '@monaco-editor/react'

export const anchorLanguage: Monaco['languages']['IMonarchLanguage'] = {
  defaultToken: 'invalid',
  tokenPostfix: '.rs',
  ignoreCase: false,

  keywords: [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
    'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
    'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
    'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
    'unsafe', 'use', 'where', 'while', 'box', 'macro_rules', 'union',
    'abstract', 'become', 'macro', 'override', 'priv', 'try', 'typeof',
    'unsized', 'virtual', 'yield',
  ],

  // Anchor-specific types
  anchorTypes: [
    'Account', 'AccountInfo', 'AccountLoader', 'Accounts', 'AnchorDeserialize',
    'AnchorSerialize', 'Box', 'CpiContext', 'Id', 'Interface', 'InterfaceAccount',
    'Key', 'Loader', 'Owner', 'Program', 'ProgramAccount', 'ProgramError',
    'Rent', 'Result', 'Signer', 'State', 'StateContext', 'System',
    'Sysvar', 'ToAccountInfo', 'ToAccountInfos', 'ToAccountMetas', 'Token',
    'UncheckedAccount', 'anchor_lang', 'anchor_spl', 'solana_program',
    'Pubkey', 'AccountMeta', 'Instruction', 'Clock',
    'Context', 'ErrorCode',
  ],

  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },
      { include: '@rawStrings' },
      { include: '@comments' },
      { include: '@attributes' },
      { include: '@lifetimes' },
      { include: '@macros' },
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@anchorTypes': 'type.identifier',
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/[{}]/, 'delimiter.curly'],
      [/[\u005B\u005D]/, 'delimiter.square'],
      [/[()]/, 'delimiter.parenthesis'],
      [/[<>]/, 'delimiter.angle'],
      [/[=><!~?:&|+*/%^-]+/, 'operator'],
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
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],

    rawStrings: [
      [/r#*"/, 'string', '@rawString'],
    ],

    rawString: [
      [/[^"]+/, 'string'],
      [/"/, 'string', '@pop'],
    ],

    attributes: [
      [/#\[/, 'annotation', '@attribute'],
    ],

    attribute: [
      [/[^\]]+/, 'annotation'],
      [/\]/, 'annotation', '@pop'],
    ],

    comments: [
      [/\/\*/, 'comment', '@comment'],
      [/\/\/\/.*$/, 'comment.doc'],
      [/\/\/.*$/, 'comment'],
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
