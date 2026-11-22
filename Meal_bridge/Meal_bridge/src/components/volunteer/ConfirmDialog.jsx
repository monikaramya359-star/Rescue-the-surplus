import { CheckCircle2 } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-stone-600 leading-relaxed">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          icon={CheckCircle2}
          className="w-full sm:w-auto"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
