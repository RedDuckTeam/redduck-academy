import { SignUpGoogleButton } from '@/components/sign-up/sign-up-google-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import { DuckIcon } from '@/components/ui/icons/duck'
import { Loader } from '@/components/ui/loader'
import { Text } from '@/components/ui/text'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up')({ component: SignUp })

function SignUp() {
  return (
    <main className="flex flex-col">
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>asdasd</DialogHeader>
          <DialogBody>
            <Loader />
          </DialogBody>
        </DialogContent>
      </Dialog>
      <div className="p-[60px] flex flex-col">
        <div>
          <Text variant="title-80">_REGISTER ON COURSE</Text>
        </div>
        <div className="flex flex-col flex-1 h-full justify-center gap-5 items-center">
          <SignUpGoogleButton />
          <Button>Continue with Email</Button>
        </div>
      </div>
      <div className="flex gap-[107px] px-10 py-3 bg-black">
        <Text variant="caps-20" className="text-white text-nowrap">
          DeFi
        </Text>
        <Text variant="caps-20" className="text-white text-nowrap">
          Rebase tokens
        </Text>
        <Text variant="caps-20" className="text-white text-nowrap">
          DEX
        </Text>
        <Text variant="caps-20" className="text-white text-nowrap">
          Synthetic tokens
        </Text>
        <Text variant="caps-20" className="text-white text-nowrap">
          DeFi
        </Text>
      </div>
      <div className="flex items-center justify-between px-[60px] pb-[60px] pt-[27px]">
        <div className="flex flex-col">
          <Text variant={'caps-24'}>redduck</Text>
          <Text variant={'caps-24'}>blockchain</Text>
          <Text variant={'caps-24'}>academy</Text>
        </div>
        <div className="size-[90px] bg-primary flex items-center justify-center">
          <DuckIcon />
        </div>
      </div>
    </main>
  )
}
