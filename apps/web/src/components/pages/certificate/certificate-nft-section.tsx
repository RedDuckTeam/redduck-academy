import { Link } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { InfoModal } from '@/components/ui/info-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { useCertificateNft } from '@/hooks/api/certificates/useCertificateNft'
import { useSession } from '@/hooks/useSession'
import { shortAddress } from '@/lib/utils'
import type { PublicCertificate } from '@/lib/api/certificates'

interface CertificateNftSectionProps {
  certificate: Pick<PublicCertificate, 'id' | 'status' | 'name' | 'tokenId' | 'txHash'>
}

type WalletChoice = { address: string; embedded: boolean }

export function CertificateNftSection({ certificate }: CertificateNftSectionProps) {
  const { status, showConfirm, setShowConfirm, showSuccess, setShowSuccess, handleRequest, isPending, buttonLabel } =
    useCertificateNft(certificate)
  const { user } = usePrivy()
  const { session } = useSession()
  const username = session?.user?.username ?? ''

  const wallets: WalletChoice[] = (user?.linkedAccounts ?? [])
    .filter((a) => a.type === 'wallet' && a.chainType === 'ethereum')
    .map((a) => {
      const wallet = a as { address: string; walletClientType?: string }
      return { address: wallet.address, embedded: wallet.walletClientType === 'privy' }
    })

  const hasMultipleWallets = wallets.length > 1

  return (
    <>
      <Button
        type="button"
        variant="default"
        className="h-[60px] min-h-[60px] w-full"
        onClick={() => setShowConfirm(true)}
        disabled={status !== 'created' || isPending || wallets.length === 0}
      >
        {buttonLabel}
      </Button>

      <Dialog open={showConfirm} onOpenChange={(o) => !o && setShowConfirm(false)}>
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request NFT Certificate</DialogTitle>
          </DialogHeader>
          <DialogBody className="gap-6">
            <div className="flex flex-col gap-2">
              <Text variant="main-18">
                Your certificate will be minted as an NFT and will appear in your wallet soon.
              </Text>
              <Text variant="main-18">Please verify that your name is correct</Text>
              <Text variant="caps-20" className="min-w-0 max-w-full break-all">
                {certificate.name}
              </Text>
            </div>

            {hasMultipleWallets && <Text variant="main-18">Choose which wallet should receive the certificate:</Text>}

            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full" asChild disabled={!username}>
                <Link to="/profile/$username" params={{ username }}>
                  Change Name
                </Link>
              </Button>

              {hasMultipleWallets ? (
                wallets.map((w) => (
                  <Button key={w.address} className="w-full" onClick={() => handleRequest(w.address)}>
                    {w.embedded ? 'Embedded' : 'Connected'} {shortAddress(w.address)}
                  </Button>
                ))
              ) : (
                <Button
                  className="w-full"
                  onClick={() => wallets[0] && handleRequest(wallets[0].address)}
                  disabled={wallets.length === 0}
                >
                  Continue
                </Button>
              )}
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <InfoModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Certificate Requested"
        description="Your NFT certificate has been requested. It will appear in your wallet soon."
      />
    </>
  )
}
