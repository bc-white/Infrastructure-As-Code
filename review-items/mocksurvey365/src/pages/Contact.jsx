import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Menu, X, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { toast } from 'sonner';
import api from '../service/api';

const Contact = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');
    
    try {
      // Build email message with all form data
      const emailMessage = `
Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company || 'N/A'}
Phone: ${formData.phone || 'N/A'}
Subject: ${formData.subject}

Message:
${formData.message}
      `.trim();

      const emailData = {
        to: 'staff@theinspac.com',
        subject: `Contact Form: ${formData.subject}`,
        message: emailMessage,
        fileUrl: '',
      };

      await api.survey.requestEmail(emailData);
      
      setSubmitStatus('success');
      toast.success('Message sent successfully! We\'ll be in touch soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
     
      setSubmitStatus('error');
      toast.error('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestimonialsClick = (e) => {
    e.preventDefault();
    navigate('/');
    setTimeout(() => {
      const testimonialsSection = document.getElementById('testimonials');
      if (testimonialsSection) {
        testimonialsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#fecc1b] font-sans overflow-x-hidden relative">

      {/* Navigation - Matching HeroSection Pattern */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-50">
        <nav className="bg-white rounded-lg px-4 py-4 md:px-6 md:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="MockSurvey365 Logo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900 tracking-tight">MockSurvey365™</span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="/" className="text-base font-medium text-gray-700 hover:text-sky-700 transition-colors">Home</a>
              <a href="/" className="text-base font-medium text-gray-700 hover:text-sky-700 transition-colors">About</a>
              <a href="#testimonials" onClick={handleTestimonialsClick} className="text-base font-medium text-gray-700 hover:text-sky-700 transition-colors">Testimonials</a>
              <a href="/contact" className="text-base font-medium text-sky-700 transition-colors">Contact</a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
             <button
                    onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                    className="bg-[#246988] hover:bg-[#1e556d] text-white px-8 py-4 text-lg font-bold rounded-full transition-all hover:-translate-y-1 cursor-pointer w-fit"
                  >
                    Book a Demo
                  </button>
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
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-xl border border-gray-100 overflow-hidden z-50 shadow-xl">
              <div className="px-4 py-4 space-y-1">
                <a
                  href="/"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </a>
                <a
                  href="/"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
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
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  Testimonials
                </a>
                <a
                  href="/contact"
                  className="block px-4 py-3 text-base font-medium text-sky-700 bg-sky-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </a>
                <div className="pt-4 space-y-3 border-t border-gray-100 mt-2 px-4 pb-2">
                <button
                    onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                    className="bg-[#246988] hover:bg-[#1e556d] text-white px-8 py-4 text-lg font-bold rounded-full transition-all hover:-translate-y-1 cursor-pointer w-fit"
                  >
                    Book a Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      <AnimatedTransition show={true} animation="slide-up" duration={600}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative">
          <div className="bg-[#fecc1b] rounded-[3rem] p-8 md:p-12 lg:p-20">
          

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left Column - Contact Info & Header */}
            <div>
              <span className="text-[#246988] font-bold tracking-wider uppercase text-sm mb-4 block">
                GET IN TOUCH
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Let's Start the <br/> Conversation
              </h1>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Ready to improve your facility's compliance readiness? Our team is here to help you get started with MockSurvey365™.
              </p>

              <div className="space-y-8 mb-12">
                {/* Email address removed as per request to prevent spam */}
              </div>

              {/* Demo Button */}
              <div className="flex justify-center lg:justify-start">
                <button
                  onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                  className="bg-[#246988] hover:bg-[#1e556d] text-white px-8 py-4 text-lg font-bold rounded-full transition-all hover:-translate-y-1 cursor-pointer w-fit"
                >
                  Book a Demo
                </button>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="relative">
               {/* Decorative backdrop for form */}
               <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-xl translate-y-4 translate-x-4 opacity-50"></div>
               
               <Card className="relative bg-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden p-2 sm:p-4">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">
                          Full Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-12 rounded-xl"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">
                          Email Address
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-12 rounded-xl"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="company" className="text-sm font-semibold text-gray-700 ml-1">
                          Company
                        </label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-12 rounded-xl"
                          placeholder="Facility Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-semibold text-gray-700 ml-1">
                          Phone
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-12 rounded-xl"
                          placeholder="(555) 000-0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-semibold text-gray-700 ml-1">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-12 rounded-xl"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-semibold text-gray-700 ml-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl resize-none"
                        placeholder="Tell us about your needs..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#246988] hover:bg-[#1e556d] text-white h-14 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-[#246988]/20 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <span className="flex items-center">
                          Send Message <Send className="ml-2 w-5 h-5" />
                        </span>
                      )}
                    </Button>

                    {submitStatus === 'success' && (
                      <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                        Message sent successfully! We'll be in touch soon.
                      </div>
                    )}
                    
                    {submitStatus === 'error' && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                        Failed to send message. Please try again or email us directly at staff@mocksurvey365.com
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </AnimatedTransition>

    </div>
  );
};

export default Contact;