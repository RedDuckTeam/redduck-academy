import { Text } from '@/components/ui/text'

interface GithubStepsProps {
  path: string
}

/**
 * Said before they leave, in the order they will meet it. People stop at the hand-off because a
 * fork they did not ask for looks like something going wrong.
 */
export function GithubSteps({ path }: GithubStepsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caps-12" element="span" className="text-muted-foreground">
        What happens over there
      </Text>
      <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-muted-foreground">
        <li>
          <Text variant="main-14" element="span">
            GitHub opens <span className="font-mono break-all">{path}</span> in its own editor. Sign in if it asks, it
            brings you straight back.
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            Select everything in the editor (Ctrl+A, or ⌘A on a Mac) and paste. Your version replaces what is on screen.
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            Press <b>Commit changes…</b>, then <b>Propose changes</b>, then <b>Create pull request</b>. A maintainer
            reviews it from there, and your change goes live once it is merged.
          </Text>
        </li>
      </ol>
    </div>
  )
}
