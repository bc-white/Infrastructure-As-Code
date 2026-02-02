import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"

export default function ChatBox() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(true)

  const handleOptionClick = (option) => {
    setShowOptions(false)
    setIsOpen(false)
    // Route to different flows based on option
    if (option === "healthcare") {
      navigate("/healthcare-providers")
    } else if (option === "assisted-living") {
      navigate("/family-care", { state: { option } })
    }
  }

  return (
    <>
      {/* Chat Button - Fixed at bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center md:w-16 md:h-16"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-80 lg:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn max-w-md">
          <div className="bg-primary text-white p-4">
            <h3 className="font-semibold text-lg">How can we help you?</h3>
            <p className="text-sm text-white/90 mt-1">
              We're here to assist you
            </p>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {showOptions ? (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    Do you have family members or elderly loved ones that you want to:
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => handleOptionClick("healthcare")}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-medium">Link to Healthcare Providers</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Connect with healthcare professionals
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleOptionClick("assisted-living")}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-medium">Assisted Living or Long-term Care</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Find suitable care facilities
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Redirecting you to get started...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

