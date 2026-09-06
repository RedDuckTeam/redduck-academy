import { useMutation } from '@tanstack/react-query'
import { copyToClipboard } from '@/lib/editor/github-publish'

export type HandoffResult = 'opened' | 'blocked' | 'copy-failed'

/**
 * Puts the file on the clipboard and opens GitHub's editor.
 *
 * The copy is awaited first because opening the tab moves focus off this document, and Chrome
 * refuses `clipboard.writeText` from a document that is not focused. The order is load-bearing.
 */
export const useGithubHandoff = () =>
  useMutation<HandoffResult, Error, { content: string; url: string }>({
    mutationFn: async ({ content, url }) => {
      if (!(await copyToClipboard(content))) return 'copy-failed'

      // `noopener` in the feature string makes `window.open` return null by spec, which is
      // indistinguishable from a blocked popup, so the opener is severed on the handle instead.
      const tab = window.open(url, '_blank')
      if (tab) tab.opener = null
      return tab ? 'opened' : 'blocked'
    },
  })
