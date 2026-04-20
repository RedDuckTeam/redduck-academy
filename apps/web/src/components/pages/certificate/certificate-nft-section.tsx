import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { InfoModal } from '@/components/ui/info-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { useCertificateNft } from '@/hooks/api/certificates/useCertificateNft'
import type { PublicCertificate } from '@/lib/api/certificates'

interface CertificateNftSectionProps {
  certificate: Pick<PublicCertificate, 'id' | 'status' | 'name' | 'tokenId' | 'txHash'>
}

export function CertificateNftSection({ certificate }: CertificateNftSectionProps) {
  const { status, showConfirm, setShowConfirm, showSuccess, setShowSuccess, handleRequest, isPending, buttonLabel } =
    useCertificateNft(certificate)

  return (
    <>
      <Button
        type="button"
        variant="default"
        className="h-[60px] min-h-[60px] w-full"
        onClick={() => setShowConfirm(true)}
        disabled={status !== 'created' || isPending}
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/profile">Change Name</Link>
              </Button>
              <Button className="flex-1" onClick={handleRequest}>
                Continue
              </Button>
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
