import { useState } from 'react';

interface PhotoGalleriaProps {
  images: string[];
  title?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  onImageClick?: (index: number) => void;
  showSeeAllBadge?: boolean;
  onSeeAllClick?: () => void;
}

const PhotoGalleria = ({
  images,
  title = 'Photos',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  onImageClick,
  showSeeAllBadge = false,
  onSeeAllClick,
}: PhotoGalleriaProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Random aspect ratio patterns for variety
  const getAspectRatioClass = (index: number): string => {
    const patterns = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square'];
    return patterns[index % patterns.length];
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  // Generate responsive grid classes based on columns prop
  const gridColsClass = `grid-cols-${columns.mobile || 2} sm:grid-cols-${columns.tablet || 3} lg:grid-cols-${columns.desktop || 4}`;

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div className={`grid ${gridColsClass} gap-2 md:gap-3`}>
        {images.map((image, index) => {
          const isLastImage = index === images.length - 1 && showSeeAllBadge;
          const isLoaded = loadedImages.has(index);

          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-lg cursor-pointer group ${getAspectRatioClass(index)}`}
              onClick={() => isLastImage && onSeeAllClick ? onSeeAllClick() : handleImageClick(index)}
            >
              {/* Loading Skeleton */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-bg-weak-25 animate-pulse" />
              )}

              {/* Image */}
              <img
                src={image}
                alt={`${title} - Photo ${index + 1}`}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                } group-hover:scale-110`}
                loading="lazy"
                onLoad={() => handleImageLoad(index)}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

              {/* See All Badge (only on last image if enabled) */}
              {isLastImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold group-hover:bg-black/80 transition-all duration-300 transform group-hover:scale-105">
                    See All Photos
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoGalleria;
