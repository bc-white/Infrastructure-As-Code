import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import ChatBox from "../components/ChatBox/ChatBox"

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  
  // Images for right panel carousel
  const images = [
    "https://images.pexels.com/photos/8172772/pexels-photo-8172772.jpeg",
    "https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg",
    "https://images.pexels.com/photos/6787970/pexels-photo-6787970.jpeg",
    "https://images.pexels.com/photos/8172772/pexels-photo-8172772.jpeg"
  ]
  
  // Marketing messages for left panel carousel
  const marketingMessages = [
    {
      title: "Streamline Compliance",
      description: "Stay compliant with state regulations effortlessly. Our platform ensures you meet all requirements with built-in templates and automated tracking."
    },
    {
      title: "Team Coordination Made Easy",
      description: "Coordinate your team members seamlessly. Assign roles, manage permissions, and keep everyone aligned on facility operations."
    },
    {
      title: "Comprehensive Survey Builder",
      description: "Create detailed surveys tailored to your needs. Build, customize, and deploy compliance surveys with our intuitive builder."
    },
    {
      title: "All-in-One Solution",
      description: "Manage everything from one platform. Surveys, compliance, team coordination, and documentation—all in one place."
    }
  ]
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // On mobile, always show background when scrolling, on desktop use threshold
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        // On mobile, show background immediately when any scroll happens
        setScrolled(window.scrollY >= 0)
      } else {
        // On desktop, use threshold
        setScrolled(window.scrollY > 20)
      }
    }
    window.addEventListener("scroll", handleScroll)
    // Check on mount
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  // Image carousel effect
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setFadeKey(prev => prev + 1)
      setTimeout(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length)
      }, 500) // Half of fade duration
    }, 4000) // Change every 4 seconds

    return () => clearInterval(imageInterval)
  }, [images.length])

  // Marketing message carousel effect
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % marketingMessages.length)
    }, 5000) // Change every 5 seconds (slightly offset from images)

    return () => clearInterval(messageInterval)
  }, [marketingMessages.length])


  return (
    <div className="h-screen bg-gray-50 overflow-hidden md:overflow-visible flex flex-col">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white backdrop-blur-sm border-b border-gray-200 shadow-sm" 
          : "bg-white/90 backdrop-blur-sm md:bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              {/* <span className="text-lg md:text-xl font-bold text-gray-900">MockSurvey365 Senior Living</span> */}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hidden sm:flex text-sm md:text-base"
                size="sm"
              >
                Log in
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-sm md:text-base"
                size="sm"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Fits in viewport on desktop */}
      <div className="flex-1 flex flex-col justify-center pt-14 md:pt-16 pb-4 md:pb-8 px-4 sm:px-6 lg:px-8 overflow-y-auto md:overflow-hidden">
        {/* Hero Section */}
        <section className="mb-6 md:mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 md:mb-4">
              MockSurvey365 Senior Living
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Streamline your facility operations and ensure compliance with our comprehensive platform.
            </p>
          </div>
        </section>

        {/* Main Content Card */}
        <section className="flex-1 flex items-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-200">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left Section - Rotating Marketing Messages */}
                <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center relative min-h-[250px] md:min-h-[400px]">
                  <div 
                    key={currentMessageIndex}
                    className="animate-fadeIn"
                    style={{
                      animation: "fadeIn 0.8s ease-in-out"
                    }}
                  >
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-3 md:mb-4">
                    What is MockSurvey365 Senior Living?
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    {marketingMessages[currentMessageIndex].description}
                  </p>
                  </div>
                  
                  {/* Message indicators */}
                  <div className="flex gap-2 mt-6 md:mt-8">
                    {marketingMessages.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          index === currentMessageIndex 
                            ? "bg-primary flex-1" 
                            : "bg-gray-300 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Section - Rotating Image Carousel */}
                <div className="relative overflow-hidden min-h-[250px] md:min-h-[400px]">
                  {images.map((image, index) => (
                    <div
                      key={`${image}-${fadeKey}`}
                      className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
                        index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                      style={{
                        backgroundImage: `url('${image}')`
                      }}
                    />
                  ))}
                  
                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          index === currentImageIndex 
                            ? "bg-white w-8" 
                            : "bg-white/50 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Chat Box */}
      <ChatBox />

      {/* Footer - Fixed at bottom on desktop, scrollable on mobile */}
      <footer className="bg-gray-900 text-white py-4 md:py-6 px-4 sm:px-6 lg:px-8 mt-auto md:mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-2 md:mb-0">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="h-3 w-3 md:h-5 md:w-5 text-white" />
              </div>
              <span className="text-base md:text-xl font-bold">MockSurvey365 Senior Living</span>
            </div>
            <div className="text-xs md:text-sm text-gray-400">
              © {new Date().getFullYear()} MockSurvey365 Senior Living. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

