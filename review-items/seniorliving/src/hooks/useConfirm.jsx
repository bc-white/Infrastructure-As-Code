import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "Confirm",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
    onConfirm: null,
    onCancel: null
  })

  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: options.title || "Confirm",
        description: message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        onConfirm: () => {
          resolve(true)
          setConfirmState(prev => ({ ...prev, open: false, onConfirm: null, onCancel: null }))
        },
        onCancel: () => {
          resolve(false)
          setConfirmState(prev => ({ ...prev, open: false, onConfirm: null, onCancel: null }))
        }
      })
    })
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={confirmState.open}
      onOpenChange={(open) => {
        if (!open && confirmState.onCancel) {
          confirmState.onCancel()
        }
      }}
      title={confirmState.title}
      description={confirmState.description}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      variant={confirmState.variant}
      onConfirm={confirmState.onConfirm}
    />
  )

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

