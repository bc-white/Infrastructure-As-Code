import React, { createContext, useContext, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog, type ConfirmationDialogProps } from "@/components/ui/confirmation-dialog";

interface NotificationContextType {
  showToast: (title: string, description?: string, variant?: "default" | "destructive") => void;
  showNotification: (props: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
  showConfirmation: (options: Omit<ConfirmationDialogProps, "open" | "onOpenChange">) => void;
  hideConfirmation: () => void;
  clearAllToasts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast, dismiss } = useToast();
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    options: Omit<ConfirmationDialogProps, "open" | "onOpenChange">;
  }>({
    isOpen: false,
    options: {
      title: "",
      description: "",
      onConfirm: () => {},
    },
  });

  const showToast = useCallback(
    (title: string, description?: string, variant: "default" | "destructive" = "default") => {
      toast({
        title,
        description,
        variant,
      });
    },
    [toast]
  );

  const showNotification = useCallback(
    ({ title, description, variant = "default" }: { 
      title: string; 
      description?: string; 
      variant?: "default" | "destructive" 
    }) => {
      toast({
        title,
        description,
        variant,
      });
    },
    [toast]
  );

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    },
    [toast]
  );

  const showError = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      });
    },
    [toast]
  );

  const showInfo = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    },
    [toast]
  );

  const showConfirmation = (options: Omit<ConfirmationDialogProps, "open" | "onOpenChange">) => {
    setConfirmation({
      isOpen: true,
      options,
    });
  };

  const hideConfirmation = () => {
    setConfirmation((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const clearAllToasts = useCallback(() => {
    dismiss();
  }, [dismiss]);

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirmation,
        hideConfirmation,
        clearAllToasts,
      }}
    >
      {children}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={(isOpen) => setConfirmation((prev) => ({ ...prev, isOpen }))}
        {...confirmation.options}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationProvider; 