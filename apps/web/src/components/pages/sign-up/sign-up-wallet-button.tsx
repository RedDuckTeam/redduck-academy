import { cn } from '@/lib/utils'
import { Text } from '../../ui/text'
import { LongArrowRight } from '../../ui/icons/long-arrow-right'
import { useLogin } from '@privy-io/react-auth'

export const SignUpWalletButton = () => {
  const { login } = useLogin()

  return (
    <button
      className={cn(
        'flex w-full max-w-[850px] min-h-[100px] cursor-pointer items-center justify-between rounded-[80px] bg-foreground px-10 py-[18px] md:translate-x-20 md:min-h-0 md:px-[70px]',
      )}
      onClick={() => login({ loginMethods: ['wallet'] })}
    >
      <Text variant="title-80" className="min-h-0 text-background max-md:text-[32px] max-md:leading-none">
        02
      </Text>
      <Text variant="subtitle-45" className="text-background max-md:text-[20px] max-md:leading-normal max-md:min-h-0">
        WEB3 WALLET
      </Text>
      <LongArrowRight className="[&_path]:fill-background" />
    </button>
  )
}
