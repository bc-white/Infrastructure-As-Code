// Navigation utility using React Router
// This provides a consistent interface for navigation throughout the app

import { useNavigate } from 'react-router-dom';

// Hook for navigation within components
export const useAppNavigate = () => {
  const navigate = useNavigate();
  return navigate;
};

// Direct navigation function (for use outside of React components)
export const navigate = (path) => {
  window.location.href = path;
};
