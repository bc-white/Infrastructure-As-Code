
import React from 'react';
import { cn } from '@/lib/utils';



export const AnimatedTransition = ({
  children,
  show,
  duration = 300,
  animation = 'fade',
  className,
  style,
}) => {
  const [render, setRender] = React.useState(show);

  React.useEffect(() => {
    if (show) setRender(true);
    
    let timer;
    if (!show && render) {
      timer = setTimeout(() => {
        setRender(false);
      }, duration);
    }
    
    return () => {  
      if (timer) clearTimeout(timer);
    };
  }, [show, render, duration]);

  if (!render) return null;

  const animationClasses = {
    fade: show ? 'animate-fade-in' : 'animate-fade-out',
    scale: show ? 'animate-scale-in' : 'animate-fade-out',
    'slide-up': show ? 'animate-slide-up' : 'animate-fade-out',
    'slide-down': show ? 'animate-slide-down' : 'animate-fade-out',
  };

  return (
    <div
      className={cn(
        animationClasses[animation],
        className,
      )}
      style={{
        animationDuration: `${duration}ms`,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedTransition;
