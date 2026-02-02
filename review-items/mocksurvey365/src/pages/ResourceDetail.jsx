import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  ChevronLeft,
  Download, 
  Star, 
  Users, 
  Shield, 
  Activity,
  Microscope,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Video,
  Clock,
  Heart,
  CheckCircle,
  ExternalLink,
  Calendar,
  Eye,
  Share2,
  User,
  Building2,
  FileText,
  Mail,
  MessageCircle,
  Linkedin,
  Twitter
} from 'lucide-react';

const ResourceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data - same as before but abbreviated for space
  const resources = [
    {
      id: 1,
      title: 'Resident Interview Guide',
      category: 'audit-checklists',
      type: 'pdf',
      description: 'Comprehensive guide for conducting resident interviews during mock surveys. Includes sample questions, documentation tips, and regulatory requirements.',
      downloadUrl: '/resources/resident-interview-guide.pdf',
      fileSize: '2.1 MB',
      downloads: 1247,
      rating: 4.8,
      lastUpdated: '2025-01-15',
      featured: true,
      icon: Users,
      tags: ['F156', 'Resident Rights', 'Interview', 'Documentation'],
      author: 'CMS Compliance Team',
      version: '3.2',
      detailedDescription: 'This comprehensive guide provides healthcare professionals with the essential tools and techniques needed to conduct effective resident interviews during mock surveys. The guide covers proper interview techniques, required documentation, privacy considerations, and regulatory compliance requirements under F156.',
      contents: [
        'Interview preparation checklist',
        'Sample questions by category',
        'Documentation templates',
        'Privacy and consent forms',
        'Regulatory compliance guide',
        'Best practices and tips'
      ],
      relatedFTags: ['F156', 'F157', 'F609'],
      status: 'active'
    },
    {
      id: 2,
      title: 'Medication Pass Observation Tool',
      category: 'audit-checklists',
      type: 'excel',
      description: 'Detailed checklist for observing medication administration practices. Helps identify potential F-tag violations and ensures compliance with CMS requirements.',
      downloadUrl: '/resources/medication-pass-tool.xlsx',
      fileSize: '456 KB',
      downloads: 892,
      rating: 4.9,
      lastUpdated: '2024-12-20',
      featured: true,
      icon: Activity,
      tags: ['F755', 'Medication', 'Observation', 'Safety'],
      author: 'Pharmacy Services Division',
      version: '2.8',
      detailedDescription: 'An interactive Excel-based tool designed to systematically observe and evaluate medication administration practices in healthcare facilities. This tool helps identify potential violations and ensures compliance with F755 requirements.',
      contents: [
        'Pre-observation setup guide',
        'Medication administration checklist',
        'Error tracking and reporting forms',
        'Compliance assessment rubric',
        'Corrective action templates',
        'Training documentation'
      ],
      relatedFTags: ['F755', 'F760', 'F329'],
      status: 'active'
    },
    {
      id: 3,
      title: 'Infection Control Audit (ICAR)',
      category: 'audit-checklists',
      type: 'pdf',
      description: 'Complete infection control assessment and reporting tool aligned with CMS requirements. Includes environmental rounds checklist and corrective action tracking.',
      downloadUrl: '/resources/infection-control-audit.pdf',
      fileSize: '1.8 MB',
      downloads: 756,
      rating: 4.7,
      lastUpdated: '2025-01-10',
      featured: false,
      icon: Microscope,
      tags: ['F441', 'F684', 'Infection Control', 'Environmental'],
      author: 'Infection Prevention Team',
      version: '4.1',
      detailedDescription: 'The Infection Control Audit and Reporting (ICAR) tool provides a comprehensive framework for assessing infection control practices and environmental safety measures in healthcare facilities.',
      contents: [
        'Environmental assessment checklist',
        'Hand hygiene observation forms',
        'PPE compliance tracking',
        'Isolation protocol verification',
        'Corrective action planning',
        'Monthly reporting templates'
      ],
      relatedFTags: ['F441', 'F684', 'F880'],
      status: 'active'
    },
    {
      id: 4,
      title: 'CMS State Operations Manual',
      category: 'cms-resources',
      type: 'pdf',
      description: 'Official CMS guidance document containing survey procedures, interpretive guidelines, and regulatory requirements for long-term care facilities.',
      downloadUrl: '/resources/cms-som.pdf',
      fileSize: '15.2 MB',
      downloads: 2156,
      rating: 4.9,
      lastUpdated: '2025-01-12',
      featured: true,
      icon: Shield,
      tags: ['CMS', 'Regulations', 'Survey Process', 'Compliance'],
      author: 'Centers for Medicare & Medicaid Services',
      version: '2025.1',
      detailedDescription: 'The official State Operations Manual provides comprehensive guidance on CMS survey and certification processes, including detailed interpretive guidelines for all F-Tags and survey procedures.',
      contents: [
        'Survey and certification overview',
        'F-Tag interpretive guidelines',
        'Survey procedures and protocols',
        'Enforcement actions and remedies',
        'Quality reporting requirements',
        'Appeals and informal dispute resolution'
      ],
      relatedFTags: ['All F-Tags'],
      status: 'active'
    },
    {
      id: 5,
      title: 'Quality Assurance Performance Improvement (QAPI) Toolkit',
      category: 'cms-resources',
      type: 'excel',
      description: 'Comprehensive QAPI implementation toolkit with templates, tracking sheets, and performance indicators for continuous quality improvement.',
      downloadUrl: '/resources/qapi-toolkit.xlsx',
      fileSize: '3.2 MB',
      downloads: 623,
      rating: 4.6,
      lastUpdated: '2024-11-30',
      featured: true,
      icon: TrendingUp,
      tags: ['F865', 'QAPI', 'Quality', 'Performance'],
      author: 'Quality Management Division',
      version: '1.5',
      detailedDescription: 'A complete toolkit for implementing and maintaining a Quality Assurance and Performance Improvement program in compliance with F865 requirements.',
      contents: [
        'QAPI program implementation guide',
        'Performance indicator tracking sheets',
        'Data collection templates',
        'Analysis and reporting tools',
        'Action plan development forms',
        'Meeting documentation templates'
      ],
      relatedFTags: ['F865', 'F656', 'F725'],
      status: 'active'
    },
    {
      id: 6,
      title: 'Emergency Preparedness Compliance Guide',
      category: 'cms-resources',
      type: 'pdf',
      description: 'Complete emergency preparedness compliance guide covering all CMS requirements for emergency planning, training, and response protocols.',
      downloadUrl: '/resources/emergency-preparedness.pdf',
      fileSize: '1.5 MB',
      downloads: 578,
      rating: 4.8,
      lastUpdated: '2024-10-15',
      featured: false,
      icon: AlertCircle,
      tags: ['F835', 'Emergency', 'Preparedness', 'Training'],
      author: 'Emergency Management Office',
      version: '3.0',
      detailedDescription: 'A comprehensive guide covering all aspects of emergency preparedness planning, training, and compliance with F835 requirements including recent updates and best practices.',
      contents: [
        'Emergency plan development guide',
        'Staff training requirements',
        'Communication protocols',
        'Evacuation procedures',
        'Supply and equipment checklists',
        'Annual review and testing schedules'
      ],
      relatedFTags: ['F835', 'F836', 'F837'],
      status: 'active'
    },
    {
      id: 7,
      title: 'New Surveyor Training Program',
      category: 'training-materials',
      type: 'video',
      description: 'Comprehensive video training series for new surveyors covering survey fundamentals, F-Tag applications, and best practices.',
      downloadUrl: '/resources/surveyor-training-series',
      fileSize: '2.8 GB',
      downloads: 445,
      rating: 4.7,
      lastUpdated: '2024-12-05',
      featured: true,
      icon: Video,
      tags: ['Training', 'Surveyor', 'F-Tags', 'Best Practices'],
      author: 'CMS Training Division',
      version: '4.2',
      detailedDescription: 'A complete training program designed for new surveyors, covering all essential aspects of the survey process, regulatory compliance, and professional development.',
      contents: [
        'Survey process overview',
        'F-Tag interpretation and application',
        'Interview techniques',
        'Documentation requirements',
        'Professional conduct standards',
        'Continuing education requirements'
      ],
      relatedFTags: ['F156', 'F880', 'F441', 'F725'],
      status: 'active'
    },
    {
      id: 8,
      title: 'Administrator Compliance Workshop',
      category: 'training-materials',
      type: 'pdf',
      description: 'Workshop materials for healthcare administrators focusing on regulatory compliance, quality improvement, and survey preparation strategies.',
      downloadUrl: '/resources/admin-workshop.pdf',
      fileSize: '4.1 MB',
      downloads: 823,
      rating: 4.6,
      lastUpdated: '2024-11-22',
      featured: false,
      icon: Users,
      tags: ['Administration', 'Leadership', 'Compliance', 'Workshop'],
      author: 'Healthcare Leadership Institute',
      version: '2.1',
      detailedDescription: 'Interactive workshop materials designed to help healthcare administrators understand their compliance responsibilities and develop effective survey readiness strategies.',
      contents: [
        'Regulatory overview presentation',
        'Leadership responsibilities guide',
        'Survey preparation checklist',
        'Staff training protocols',
        'Quality improvement strategies',
        'Risk assessment tools'
      ],
      relatedFTags: ['F865', 'F880', 'F156'],
      status: 'active'
    },
    {
      id: 9,
      title: 'Quick Reference: Common F-Tag Violations',
      category: 'quick-tips',
      type: 'pdf',
      description: 'One-page quick reference guide highlighting the most commonly cited F-Tags, their key requirements, and prevention strategies.',
      downloadUrl: '/resources/common-ftags-quick-ref.pdf',
      fileSize: '180 KB',
      downloads: 1834,
      rating: 4.9,
      lastUpdated: '2025-01-08',
      featured: true,
      icon: BookOpen,
      tags: ['F-Tags', 'Quick Reference', 'Violations', 'Prevention'],
      author: 'Survey Readiness Team',
      version: '1.3',
      detailedDescription: 'A concise, one-page reference guide that healthcare staff can quickly access to understand the most frequently cited F-Tags and how to avoid common violations.',
      contents: [
        'Top 10 most cited F-Tags',
        'Key violation triggers',
        'Quick prevention tips',
        'Documentation requirements',
        'Red flag indicators',
        'Immediate action steps'
      ],
      relatedFTags: ['F880', 'F441', 'F725', 'F156', 'F755'],
      status: 'active'
    },
    {
      id: 10,
      title: '5-Minute Survey Prep Checklist',
      category: 'quick-tips',
      type: 'checklist',
      description: 'Ultra-quick daily checklist that can be completed in 5 minutes to ensure ongoing survey readiness and compliance.',
      downloadUrl: '/resources/5min-survey-prep.pdf',
      fileSize: '95 KB',
      downloads: 2456,
      rating: 4.8,
      lastUpdated: '2024-12-28',
      featured: true,
      icon: Clock,
      tags: ['Daily Checklist', 'Survey Prep', 'Quick Tips', 'Readiness'],
      author: 'Compliance Quick Tips Team',
      version: '2.0',
      detailedDescription: 'A streamlined daily checklist designed to help facilities maintain survey readiness through quick, focused daily activities that take only 5 minutes to complete.',
      contents: [
        'Daily visual inspection points',
        'Staff readiness check',
        'Documentation spot check',
        'Resident care verification',
        'Environmental safety scan',
        'Emergency equipment check'
      ],
      relatedFTags: ['F880', 'F441', 'F156', 'F454'],
      status: 'active'
    },
    {
      id: 11,
      title: 'Dining Service Quick Assessment',
      category: 'quick-tips',
      type: 'checklist',
      description: 'Fast 10-point assessment tool for evaluating dining services during meal periods to ensure compliance and quality.',
      downloadUrl: '/resources/dining-quick-assessment.pdf',
      fileSize: '125 KB',
      downloads: 967,
      rating: 4.5,
      lastUpdated: '2024-11-15',
      featured: false,
      icon: Heart,
      tags: ['F812', 'Dining', 'Quick Assessment', 'Meal Service'],
      author: 'Dietary Services Team',
      version: '1.8',
      detailedDescription: 'A rapid assessment tool that enables staff to quickly evaluate dining service quality and compliance during actual meal service periods.',
      contents: [
        '10-point meal service checklist',
        'Food temperature verification',
        'Resident satisfaction indicators',
        'Staff performance markers',
        'Environmental cleanliness check',
        'Documentation requirements'
      ],
      relatedFTags: ['F812', 'F808', 'F809'],
      status: 'active'
    }
  ];

  const resource = resources.find(r => r.id === parseInt(id)) || resources[0];


  const getCategoryLabel = (category) => {
    const categoryMap = {
      'audit-checklists': 'Audit & Compliance',
      'cms-resources': 'CMS Resources',
      'training-materials': 'Professional Development',
      'quick-tips': 'Quick Reference'
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm overflow-x-auto pb-1">
            <button
              onClick={() => navigate('/resource-center')}
              className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Resource Center
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate">{getCategoryLabel(resource.category)}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{resource.title}</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          
          {/* Article */}
          <article className="lg:col-span-8">
            
            {/* Article Header */}
            <header className="mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4">
                <span className="inline-block px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-sm">
                  {getCategoryLabel(resource.category)}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                {resource.title}
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
                {resource.description}
              </p>
              
              {/* Author & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 border-t border-b border-gray-200 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{resource.author}</div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      Published {new Date(resource.lastUpdated).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} • {resource.downloads.toLocaleString()} downloads
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Article Body */}
            <div className="prose prose-sm sm:prose-lg max-w-none">
              
              {/* Overview */}
              <section className="mb-8 sm:mb-12">
                <p className="text-gray-800 leading-relaxed text-base sm:text-lg mb-4 sm:mb-6">
                  {resource.detailedDescription}
                </p>
                
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Healthcare facilities face increasing regulatory scrutiny, making comprehensive preparation essential for successful survey outcomes. This resource provides practical tools and methodologies that have been tested across hundreds of facilities nationwide.
                </p>
              </section>

              {/* Key Components */}
              <section className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">What's Included</h2>
                
                <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg mb-6 sm:mb-8">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {resource.contents.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 sm:mt-3 flex-shrink-0"></div>
                        <span className="text-gray-700 leading-relaxed text-sm sm:text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Each component has been developed through extensive collaboration with CMS surveyors, facility administrators, and compliance experts to ensure practical applicability and regulatory alignment.
                </p>
              </section>

              {/* Implementation */}
              <section className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Implementation Guidelines</h2>
                
                <div className="border-l-4 border-blue-500 pl-4 sm:pl-6 mb-6 sm:mb-8">
                  <p className="text-gray-700 italic text-base sm:text-lg">
                    "Successful implementation requires a systematic approach that addresses both procedural compliance and staff preparedness."
                  </p>
                  <cite className="text-gray-600 text-xs sm:text-sm">— Healthcare Compliance Standards, 2025</cite>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  This resource should be integrated into your facility's existing quality assurance framework. Begin with a baseline assessment using the provided checklists, then implement the recommended procedures systematically over a 30-day period.
                </p>
                
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Regular monitoring and adjustment ensure sustained compliance and improved survey readiness across all operational areas.
                </p>
              </section>

              {/* Regulatory Context */}
              <section className="mb-8 sm:mb-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Regulatory Framework</h2>
                
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  The following F-Tags are directly addressed by this resource:
                </p>
                
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {resource.relatedFTags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="font-mono text-xs sm:text-sm bg-red-50 text-red-700 px-2 sm:px-3 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Understanding the interconnected nature of these regulations is crucial for comprehensive compliance. Each F-Tag represents specific requirements that must be systematically addressed through documented policies and consistent implementation.
                </p>
              </section>

            </div>
          </article> 

          {/* Sidebar */}
          <aside className="lg:col-span-4 order-first lg:order-last">
            <div className="lg:sticky lg:top-8 space-y-6 sm:space-y-8">
              
              {/* Download Actions */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Access Resource</h3>
                <div className="space-y-2 sm:space-y-3">
                 
                  <Button 
                    variant="outline" 
                    className="w-full justify-center border-gray-300 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Online
                  </Button>
                </div>
                
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Version</span>
                    <span className="font-medium">{resource.version}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Format</span>
                    <span className="font-medium uppercase">{resource.type}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Downloads</span>
                    <span className="font-medium">{resource.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Updated</span>
                    <span className="font-medium">
                      {new Date(resource.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Topics */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Related Topics</h3>
                <div className="space-y-2 sm:space-y-3">
                  <a href="#" className="block text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Survey Preparation Checklist
                  </a>
                  <a href="#" className="block text-blue-600 hover:text-blue-800 font-medium text-sm">
                    F-Tag Compliance Guide
                  </a>
                  <a href="#" className="block text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Documentation Best Practices
                  </a>
                  <a href="#" className="block text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Resident Rights Training
                  </a>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Stay Updated</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Get the latest compliance resources and regulatory updates delivered to your inbox.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <input 
                    type="email" 
                    placeholder="your@email.com" 
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm">
                    Subscribe
                  </Button>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </main>

    </div>
  );
};

export default ResourceDetail; 