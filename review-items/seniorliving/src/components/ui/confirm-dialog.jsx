import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"
import { Button } from "./button"
import { AlertTriangle } from "lucide-react"

export function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title = "Confirm", 
  description, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // 'default' | 'destructive'
  onConfirm 
}) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="space-y-3 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {variant === "destructive" && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            )}
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-sm text-gray-600 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

