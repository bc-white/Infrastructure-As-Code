import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const NavigationHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTestimonialsClick = (e) => {
    e.preventDefault();
    const testimonialsSection = document.getElementById("testimonials");
    if (testimonialsSection) {
      testimonialsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="pt-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-50">
      <nav className="bg-white rounded-lg px-4 py-4 md:px-6 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MockSurvey365 Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight">MockSurvey365</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="/" className="text-base font-medium text-gray-700 hover:text-[#246988] transition-colors">Home</a>
            <a href="#about" className="text-base font-medium text-gray-700 hover:text-[#246988] transition-colors">About</a>
            <a href="#testimonials" onClick={handleTestimonialsClick} className="text-base font-medium text-gray-700 hover:text-[#246988] transition-colors">Testimonials</a>
            <a href="/contact" className="text-base font-medium text-gray-700 hover:text-[#246988] transition-colors">Contact</a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-6">
            <Button
              onClick={() => (window.location.href = "/login")}
              className="bg-[#246988] hover:bg-[#1e556d] text-white px-6 py-2.5 rounded-lg text-base font-semibold transition-all"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-xl border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-4 space-y-1">
              <a
                href="/"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#246988] hover:bg-[#246988]/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#about"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#246988] hover:bg-[#246988]/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  handleTestimonialsClick(e);
                  setIsMobileMenuOpen(false);
                }}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#246988] hover:bg-[#246988]/10 rounded-lg transition-colors"
              >
                Testimonials
              </a>
              <a
                href="/contact"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-[#246988] hover:bg-[#246988]/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-4 space-y-3 border-t border-gray-100 mt-2 px-4 pb-2">
                
                <Button
                  onClick={() => (window.location.href = "/login")}
                  className="w-full bg-[#246988] hover:bg-[#1e556d] text-white rounded-lg text-base font-bold py-3"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

