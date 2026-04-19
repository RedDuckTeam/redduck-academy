import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from './dialog'
import { Button } from './button'
import { Text } from './text'

interface InfoModalProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  description: string
  buttonLabel?: string
}

export function InfoModal({ open, onClose, onConfirm, title, description, buttonLabel = 'OK' }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-6">
          <Text variant="main-18">{description}</Text>
          <Button onClick={onConfirm ?? onClose} className="w-full">
            {buttonLabel}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
