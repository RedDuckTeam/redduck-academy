import { Text } from '@/components/ui/text'

interface GithubStepsProps {
  path: string
}

export function GithubSteps({ path }: GithubStepsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caps-12" element="span" className="text-muted-foreground">
        What happens on GitHub
      </Text>
      <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-muted-foreground">
        <li>
          <Text variant="main-14" element="span">
            GitHub opens <span className="font-mono break-all">{path}</span> in its own editor. If you have no account
            it asks you to make one, which is free, and then brings you back to this file.
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            Select everything in the editor with Ctrl+A, or ⌘A on a Mac, then paste over it. Paste without selecting
            first and the lesson ends up in the file twice.
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            Press <b>Commit changes…</b>, then <b>Propose changes</b>, then <b>Create pull request</b>. That sends your
            version to the maintainers. Every change to this site goes through the same review, and yours is live once
            one of them accepts it.
          </Text>
        </li>
      </ol>
    </div>
  )
}
