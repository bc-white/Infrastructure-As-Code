import React, { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface DenialReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  requestType: string;
  daysRequested: number;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export const DenialReasonDialog: React.FC<DenialReasonDialogProps> = ({
  open,
  onOpenChange,
  employeeName,
  requestType,
  daysRequested,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError("Please provide a reason for denial");
      return;
    }

    if (trimmedReason.length < 10) {
      setError("Please provide a more detailed reason (at least 10 characters)");
      return;
    }

    setError("");
    onConfirm(trimmedReason);
  };

  const handleCancel = () => {
    setReason("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Deny Time-off Request
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600 leading-relaxed">
                You are about to deny <strong>{employeeName}'s</strong> {requestType} request for{" "}
                <strong>{daysRequested} day{daysRequested !== 1 ? 's' : ''}</strong>. 
                Please provide a clear reason for this decision.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="denial-reason" className="text-sm font-medium text-gray-700">
              Reason for Denial *
            </Label>
            <Textarea
              id="denial-reason"
              placeholder="Please explain why this request is being denied. This will be visible to the employee."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(""); // Clear error when user starts typing
              }}
              className={`min-h-[100px] resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {reason.length}/500 characters
            </p>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || reason.trim().length === 0}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              "Deny Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 