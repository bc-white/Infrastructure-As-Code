import { Facebook, Linkedin, Instagram, Link as LinkIcon, MessageCircle } from 'lucide-react';

export const Footer = () => {
  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/theinspac',
      icon: Facebook,
      color: 'hover:text-[#1877F2]'
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/institute-of-post-acute/',
      icon: Linkedin,
      color: 'hover:text-[#0A66C2]'
    },
    {
      name: 'Linktree',
      url: 'https://linktr.ee/theinspac',
      icon: LinkIcon,
      color: 'hover:text-[#43E55E]'
    },
    {
      name: 'Threads',
      url: 'https://www.threads.com/@inspacare',
      icon: MessageCircle,
      color: 'hover:text-black'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/inspacare/',
      icon: Instagram,
      color: 'hover:text-[#E4405F]'
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Social Media Links */}
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-600 transition-colors ${link.color}`}
                  aria-label={link.name}
                >
                  <Icon className="w-6 h-6" />
                </a>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MockSurvey365. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
