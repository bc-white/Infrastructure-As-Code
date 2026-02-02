import { useState, useEffect } from "react";

interface DiscountImageGalleryProps {
  images: string[];
  title: string;
}

const DiscountImageGallery = ({ images, title }: DiscountImageGalleryProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Group images into slides based on screen size
  const groupImagesIntoSlides = (imageArray: string[]) => {
    const slides: string[][] = [];
    const imagesPerSlide = isDesktop ? 5 : 3; // 5 for desktop, 3 for mobile

    // If we have 1 or 2 images, just show them individually
    if (imageArray.length <= 2) {
      return imageArray.map((img) => [img]);
    }

    // Group into slides
    for (let i = 0; i < imageArray.length; i += imagesPerSlide) {
      const slide = imageArray.slice(i, i + imagesPerSlide);
      slides.push(slide);
    }

    return slides;
  };

  const slides = groupImagesIntoSlides(images);
  const totalSlides = slides.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const slideWidth = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / slideWidth);
    setCurrentSlideIndex(index);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Scrollable Slides Container */}
      <div
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            className="flex-shrink-0 w-full h-full snap-center"
          >
            {/* Single Image Layout (for slides with 1 image) */}
            {slide.length === 1 && (
              <div className="w-full h-full rounded-lg">
                <img
                  src={slide[0]}
                  alt={`${title} - Image ${slideIndex * 3 + 1}`}
                  className="w-full h-full object-cover"
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                />
              </div>
            )}

            {/* Two Image Layout (for slides with 2 images) */}
            {slide.length === 2 && (
              <div className="flex h-full gap-1 rounded-lg">
                {/* First Image - Larger */}
                <div
                  className="flex-shrink-0 rounded-lg"
                  style={{ width: "66%", height: "100%" }}
                >
                  <img
                    src={slide[0]}
                    alt={`${title} - Image ${slideIndex * 3 + 1}`}
                    className="w-full h-full object-cover"
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                  />
                </div>

                {/* Second Image - Takes remaining space */}
                <div
                  className="flex-shrink-0 rounded-lg"
                  style={{ width: "32%", height: "100%" }}
                >
                  <img
                    src={slide[1]}
                    alt={`${title} - Image ${slideIndex * 3 + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Three Image Layout (for slides with 3 images) */}
            {slide.length === 3 && (
              <div className="flex h-full w-[110%] gap-1 ">
                {/* Hero Image - Left Side (65% width, full height) */}
                <div
                  className="flex-shrink-0 rounded-lg"
                  style={{ width: "55%", height: "100%" }}
                >
                  <img
                    src={slide[0]}
                    alt={`${title} - Image ${slideIndex * 3 + 1}`}
                    className="w-full h-full object-cover"
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                  />
                </div>

                {/* Stacked Images - Right Side (43% width) */}
                <div
                  className="flex flex-col gap-1"
                  style={{ width: "43%", height: "100%" }}
                >
                  {/* Top Image */}
                  <div
                    className="flex-shrink-0 rounded-lg"
                    style={{ height: "49%" }}
                  >
                    <img
                      src={slide[1]}
                      alt={`${title} - Image ${slideIndex * 3 + 2}`}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>

                  {/* Bottom Image */}
                  <div
                    className="flex-shrink-0 rounded-lg"
                    style={{ height: "49%" }}
                  >
                    <img
                      src={slide[2]}
                      alt={`${title} - Image ${slideIndex * 3 + 3}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Four Image Layout (2x2 quadrants) */}
            {slide.length === 4 && (
              <div className="flex flex-col h-full gap-1">
                {/* Top Row - 2 Images */}
                <div className="flex gap-1 flex-1 h-1/2 ">
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[0]}
                      alt={`${title} - Image ${slideIndex * 5 + 1}`}
                      className="w-full h-full object-cover"
                      loading={slideIndex === 0 ? "eager" : "lazy"}
                    />
                  </div>
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[1]}
                      alt={`${title} - Image ${slideIndex * 5 + 2}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Bottom Row - 2 Images */}
                <div className="flex gap-1 flex-1 h-1/2">
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[2]}
                      alt={`${title} - Image ${slideIndex * 5 + 3}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[3]}
                      alt={`${title} - Image ${slideIndex * 5 + 4}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Five Image Layout (1-2-2 horizontal pattern for desktop) */}
            {slide.length === 5 && (
              <div className="flex h-full gap-1">
                {/* Hero Image - Left Side (50% width, full height) */}
                <div
                  className="flex-shrink-0 rounded-lg"
                  style={{ width: "50%", height: "100%" }}
                >
                  <img
                    src={slide[0]}
                    alt={`${title} - Image ${slideIndex * 5 + 1}`}
                    className="w-full h-full object-cover"
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                  />
                </div>

                {/* Middle Stack - 2 Images Vertically (25% width) */}
                <div
                  className="flex flex-col gap-1"
                  style={{ width: "25%", height: "100%" }}
                >
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[1]}
                      alt={`${title} - Image ${slideIndex * 5 + 2}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[2]}
                      alt={`${title} - Image ${slideIndex * 5 + 3}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Right Stack - 2 Images Vertically (25% width) */}
                <div
                  className="flex flex-col gap-1"
                  style={{ width: "25%", height: "100%" }}
                >
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[3]}
                      alt={`${title} - Image ${slideIndex * 5 + 4}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 rounded-lg">
                    <img
                      src={slide[4]}
                      alt={`${title} - Image ${slideIndex * 5 + 5}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slide Indicators */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlideIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Count Badge */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium z-10">
        {currentSlideIndex + 1} / {totalSlides}
      </div>
    </div>
  );
};

export default DiscountImageGallery;
