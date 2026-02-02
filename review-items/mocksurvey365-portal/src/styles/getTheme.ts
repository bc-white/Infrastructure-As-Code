export const getTheme = () => {
  const theme = localStorage.getItem('theme');
  return theme;
};