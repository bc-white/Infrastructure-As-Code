
import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { cn } from '@/lib/utils';
import { CustomIllustration } from './FeatureIllustrations/CustomIllustration';



export const FeatureIllustration = ({ featureIndex, className }) => {
  return (
    <AnimatedTransition 
      show={featureIndex !== null} 
      animation="scale" 
      duration={500}
      className={cn("w-full mb-12", className)}
    >
      {featureIndex !== null && (
        <CustomIllustration featureIndex={featureIndex} />
      )}
    </AnimatedTransition>
  );
};
