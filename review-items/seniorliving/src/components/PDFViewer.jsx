import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function PDFViewer({ isOpen, onClose, pdfUrl, title }) {
  if (!isOpen || !pdfUrl) return null

  const handleClose = () => {
    if (onClose) {
      onClose(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4">
              {title || "PDF Viewer"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={title || "PDF Document"}
              allow="fullscreen"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

