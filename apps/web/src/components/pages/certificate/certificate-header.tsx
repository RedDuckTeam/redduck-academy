import { Text } from '@/components/ui/text'

interface CertificateHeaderProps {
  courseTitle: string
}

export function CertificateHeader({ courseTitle }: CertificateHeaderProps) {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center text-white">
      <div className="flex flex-col gap-2.5">
        <Text variant="subtitle-32" className="font-medium">
          Congratulations!
        </Text>
        <Text variant="caps-20">You finished {courseTitle.toLowerCase()} course by RedDuck</Text>
      </div>
    </div>
  )
}
