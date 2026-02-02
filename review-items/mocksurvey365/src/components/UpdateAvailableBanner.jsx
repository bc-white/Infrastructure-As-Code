import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Banner component that appears when a remote update is available
 * while the user has unsaved changes
 */
export function UpdateAvailableBanner({ 
  onAccept, 
  onDiscard, 
  onDismiss 
}) {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                New updates available
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Someone else has saved changes. You have unsaved edits. 
                <span className="font-semibold text-amber-800"> Save your changes first</span> to avoid losing them, 
                or <span className="font-semibold text-amber-800">accept updates</span> to reset your unsaved changes.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onAccept}
              className="bg-white hover:bg-amber-100 border-amber-300 text-amber-900"
              title="This will reset your unsaved changes and apply the updates from the server"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Accept Updates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
              className="bg-white hover:bg-amber-100 border-amber-300 text-amber-900"
              title="Keep your current changes. You can save them later."
            >
              Keep My Version
            </Button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-amber-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

