/**
 * Utility function to show a confirm dialog
 * This is a helper that can be used with React state management
 * For a simpler approach, use the ConfirmDialog component directly
 */

export const showConfirm = async (message, options = {}) => {
  return new Promise((resolve) => {
    // This will be handled by the ConfirmDialog component
    // The component should manage its own state
    resolve({ message, options })
  })
}
