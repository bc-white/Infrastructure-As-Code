
import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureIconProps {
  index: number;
  size?: number;
  className?: string;
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({ 
  index, 
  size = 64,
  className 
}) => {
  const iconFiles = [
    '/Icons/SurveyBuiler.png',      // Survey Builder
    '/Icons/CMSreports.png',        // CMS Reports
    '/Icons/AIdeficiecy.png',       // AI Deficiency
    '/Icons/MultiFacility.png',     // Multi-Facility
    '/Icons/ftagSearch.png',        // F-Tag Search
    '/Icons/ResourceCenter.png',    // Resource Center
    '/Icons/ExportOptions.png',     // Export Options
    '/Icons/Compliance.png',        // Compliance
    '/Icons/MobileReady.png',       // Mobile Ready
    '/Icons/DemoMode.png',          // Demo Mode
    '/Icons/Hippa.png',             // HIPAA Aligned
    '/Icons/Analytics.png'          // Analytics
  ];

  const iconPath = iconFiles[index % iconFiles.length];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src={iconPath} 
        alt={`Feature icon ${index}`}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
};
