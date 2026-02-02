import React, { useState } from "react";
import { Key, Shield, RefreshCw, Eye, EyeOff, AlertTriangle, Lock, Unlock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/store/employee";
import { useNotification } from "@/contexts/NotificationContext";

interface PasswordManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  mode: "change-password" | "reset-password" | "login-management";
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const PasswordManagementModal: React.FC<PasswordManagementModalProps> = ({
  open,
  onOpenChange,
  employee,
  mode,
}) => {
  const { showSuccess, showError, showConfirmation } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [loginSettings, setLoginSettings] = useState({
    lastLogin: employee?.lastLogin || "Never",
    accountLocked: false,
    mfaEnabled: true,
    failedAttempts: 0,
  });

  const handleInputChange = (field: keyof PasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validatePassword = (password: string): string[] => {
    const issues = [];
    if (password.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
    if (!/\d/.test(password)) issues.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push("One special character");
    return issues;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (mode === "change-password") {
      if (!formData.currentPassword.trim()) {
        newErrors.currentPassword = "Current password is required";
      }
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordIssues = validatePassword(formData.newPassword);
      if (passwordIssues.length > 0) {
        newErrors.newPassword = "Password must meet all requirements";
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Password confirmation is required";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "login-management") {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onOpenChange(false);
      
      showSuccess(
        "Success",
        `Password ${mode === "change-password" ? "changed" : "reset"} successfully!`
      );
    } catch (error) {
      showError(
        "Error",
        `Error ${mode === "change-password" ? "changing" : "resetting"} password. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountAction = async (action: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      switch (action) {
        case "unlock":
          setLoginSettings(prev => ({ ...prev, accountLocked: false, failedAttempts: 0 }));
          showSuccess("Success", "Account unlocked successfully!");
          break;
        case "lock":
          setLoginSettings(prev => ({ ...prev, accountLocked: true }));
          showSuccess("Success", "Account locked successfully!");
          break;
        case "reset-attempts":
          setLoginSettings(prev => ({ ...prev, failedAttempts: 0 }));
          showSuccess("Success", "Failed login attempts reset!");
          break;
        case "toggle-mfa":
          setLoginSettings(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }));
          showSuccess("Success", `MFA ${loginSettings.mfaEnabled ? "disabled" : "enabled"} successfully!`);
          break;
      }
    } catch (error) {
      showError("Error", "Error performing action. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!employee) return null;

  const getModalTitle = () => {
    switch (mode) {
      case "change-password": return "Change Password";
      case "reset-password": return "Reset Password";
      case "login-management": return "Login Management";
      default: return "Password Management";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Key size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Manage password and login settings for {employee.firstName} {employee.lastName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {mode === "login-management" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield size={20} />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Status</label>
                      <div className="mt-1">
                        <Badge variant={loginSettings.accountLocked ? "error" : "success"}>
                          {loginSettings.accountLocked ? "Locked" : "Active"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Login</label>
                      <div className="mt-1 text-sm text-gray-600">{loginSettings.lastLogin}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Failed Attempts</label>
                      <div className="mt-1">
                        <Badge variant={loginSettings.failedAttempts > 0 ? "warning" : "secondary"}>
                          {loginSettings.failedAttempts}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">MFA Status</label>
                      <div className="mt-1">
                        <Badge variant={loginSettings.mfaEnabled ? "success" : "warning"}>
                          {loginSettings.mfaEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      styleType="stroke"
                      onClick={() => handleAccountAction(loginSettings.accountLocked ? "unlock" : "lock")}
                      disabled={loading}
                      className="gap-2"
                    >
                      {loginSettings.accountLocked ? <Unlock size={16} /> : <Lock size={16} />}
                      {loginSettings.accountLocked ? "Unlock Account" : "Lock Account"}
                    </Button>
                    <Button
                      variant="outline"
                      styleType="stroke"
                      onClick={() => handleAccountAction("reset-attempts")}
                      disabled={loading}
                      className="gap-2"
                    >
                      <RefreshCw size={16} />
                      Reset Failed Attempts
                    </Button>
                    <Button
                      variant="outline"
                      styleType="stroke"
                      onClick={() => handleAccountAction("toggle-mfa")}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Shield size={16} />
                      {loginSettings.mfaEnabled ? "Disable MFA" : "Enable MFA"}
                    </Button>
                    <Button
                      variant="warning"
                      styleType="stroke"
                      onClick={() => {
                        showConfirmation({
                          title: "Force Password Reset",
                          description: "This will require the user to create a new password on their next login. Are you sure?",
                          confirmText: "Force Reset",
                          cancelText: "Cancel",
                          variant: "warning",
                          onConfirm: () => handleAccountAction("force-reset"),
                        });
                      }}
                      disabled={loading}
                      className="gap-2"
                    >
                      <AlertTriangle size={16} />
                      Force Password Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {mode === "change-password" ? "Password Change" : "Password Reset"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === "change-password" && (
                    <FormField
                      label="Current Password"
                      required
                      error={errors.currentPassword}
                    >
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={handleInputChange("currentPassword")}
                          placeholder="Enter current password"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          styleType="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => togglePasswordVisibility("current")}
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormField>
                  )}

                  <FormField
                    label="New Password"
                    required
                    error={errors.newPassword}
                  >
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleInputChange("newPassword")}
                        placeholder="Enter new password"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        styleType="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </FormField>

                  <FormField
                    label="Confirm New Password"
                    required
                    error={errors.confirmPassword}
                  >
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange("confirmPassword")}
                        placeholder="Confirm new password"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        styleType="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </FormField>

                  {formData.newPassword && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</div>
                      <div className="space-y-1">
                        {validatePassword(formData.newPassword).map((issue, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertTriangle size={12} />
                            {issue}
                          </div>
                        ))}
                        {validatePassword(formData.newPassword).length === 0 && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Shield size={12} />
                            Password meets all requirements
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  styleType="stroke"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto sm:flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {mode === "change-password" ? "Changing..." : "Resetting..."}
                    </>
                  ) : (
                    <>
                      <Key size={18} />
                      {mode === "change-password" ? "Change Password" : "Reset Password"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordManagementModal; 