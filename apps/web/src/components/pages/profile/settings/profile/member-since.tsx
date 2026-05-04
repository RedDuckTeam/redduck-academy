import { textVariants } from '@/components/ui/text'
import { useUserSettings } from '@/hooks/api/user/useUserSettings'

const formatMemberSince = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(/,/g, '')
}

export const MemberSince = () => {
  const { data } = useUserSettings()
  const value = data?.createdAt ? formatMemberSince(data.createdAt) : '—'

  return <span className={textVariants({ variant: 'caps-20' })}>{value}</span>
}
