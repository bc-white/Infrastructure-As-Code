import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import api from "../service/api";
import { ArrowRight, X, MessageCircle } from "lucide-react";

const SupportFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsSending(true);

      const emailData = {
        to: "staff@theinspac.com",
        subject: `Support Request: ${formData.subject}`,
        message: formData.message,
        fileUrl: "", // No file attachment for support requests
      };

      await api.survey.requestEmail(emailData);

      toast.success("Your message has been sent to our support team!");
      
      // Reset form and close
      setFormData({ subject: "", message: "" });
      setIsOpen(false);
    } catch (error) {
     
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      {/* Floating Button - hidden on mobile, visible on md and up, positioned higher to avoid overlap with page action buttons */}
      <div className="hidden md:block fixed right-6 bottom-24 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] active:scale-[0.95] shadow-lg ${
            isOpen
              ? "border-red-500/40 text-red-600 hover:border-transparent hover:text-white"
              : "border-[#075b7d]/40 text-[#075b7d] hover:border-transparent hover:text-white"
          }`}
          title={isOpen ? "Close support" : "Contact support"}
        >
          {/* Left arrow */}
          <ArrowRight 
            className={`absolute w-4 h-4 left-[-25%] fill-none z-[9] group-hover:left-4 group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isOpen ? "stroke-red-600" : "stroke-[#075b7d]"
            }`}
          />

          {/* Text */}
          <span className="relative z-[1] -translate-x-1 group-hover:translate-x-3 transition-all duration-[800ms] ease-out flex items-center gap-2">
            {isOpen ? (
              <>
                <X className="w-4 h-4" />
                Close
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Support
              </>
            )}
          </span>

          {/* Circle */}
          <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
            isOpen ? "bg-red-600" : "bg-[#075b7d]"
          }`}></span>

         
        </button>
      </div>

      {/* Support Modal - responsive positioning, above the button */}
      {isOpen && (
        <div className="hidden md:block fixed right-6 bottom-36 z-40 w-96 max-w-[calc(100vw-3rem)]">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#075b7d] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Contact Support
                  </h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    We'll respond as soon as possible
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label
                  htmlFor="subject"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  className="w-full"
                  disabled={isSending}
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="message"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Message <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="message"
                  placeholder="Please describe your issue in detail..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isSending}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  Response time: 24-48 hours
                </p>
                <Button
                  type="submit"
                  disabled={isSending}
                  className="bg-[#075b7d] hover:bg-[#075b7d]/90 disabled:bg-gray-300"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                For urgent issues, email{" "}
                <a
                  href="mailto:staff@theinspac.com"
                  className="text-[#075b7d] hover:underline font-medium"
                >
                  staff@theinspac.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportFloatingButton;
