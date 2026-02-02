import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[#075b7d]/10 rounded-lg">
              <Shield className="w-6 h-6 text-[#075b7d]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: January 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          {/* HIPAA Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Lock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">HIPAA Compliance Notice</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  MockSurvey365 is designed to be HIPAA-aligned for healthcare organizations. We implement appropriate administrative, physical, and technical safeguards to protect your information. However, this platform is for training purposes and should not be used to process actual patient health information (PHI).
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              MockSurvey365 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare compliance training platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <UserCheck className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>Name and contact information</li>
                  <li>Email address</li>
                  <li>Organization details</li>
                  <li>Professional credentials</li>
                  <li>Account preferences</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Database className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Usage Data</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>Log files and access times</li>
                  <li>IP addresses and device information</li>
                  <li>Browser type and version</li>
                  <li>Feature usage patterns</li>
                  <li>Performance analytics</li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect personal information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Account registration information (name, email, organization)</li>
              <li>Payment and billing information (processed securely through Stripe)</li>
              <li>Profile information and professional credentials</li>
              <li>Communications with our support team</li>
              <li>Survey content and training data you create</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our Service, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and feature interactions</li>
              <li>Performance and error logs</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Service Provision</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                  <li>Provide and maintain our platform</li>
                  <li>Process payments and subscriptions</li>
                  <li>Generate training reports and content</li>
                  <li>Customize your user experience</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Communication & Support</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                  <li>Send service-related notifications</li>
                  <li>Provide customer support</li>
                  <li>Respond to your inquiries</li>
                  <li>Send marketing communications (with consent)</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Improvement & Analytics</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                  <li>Analyze usage patterns and trends</li>
                  <li>Improve our services and features</li>
                  <li>Develop new functionality</li>
                  <li>Monitor system performance</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Legal & Security</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                  <li>Comply with legal obligations</li>
                  <li>Prevent fraud and abuse</li>
                  <li>Enforce our terms of service</li>
                  <li>Protect user safety and security</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We work with trusted third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
              <li><strong>AWS/Cloud Providers:</strong> Hosting and infrastructure</li>
              <li><strong>Analytics Services:</strong> Usage analytics and performance monitoring</li>
              <li><strong>Email Services:</strong> Transactional and marketing communications</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information when required by law or to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Comply with legal processes or government requests</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or security threats</li>
              <li>Enforce our terms and policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <Lock className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Security Measures</h3>
                  <p className="text-green-800 text-sm leading-relaxed">
                    We implement industry-standard security measures including encryption, access controls, and regular security assessments to protect your information.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-4">
              We employ a variety of security measures to protect your personal information:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                  <li>SSL/TLS encryption for data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Regular security patches and updates</li>
                  <li>Secure authentication mechanisms</li>
                  <li>Network firewalls and intrusion detection</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative Safeguards</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                  <li>Employee access controls and training</li>
                  <li>Regular security audits and assessments</li>
                  <li>Incident response procedures</li>
                  <li>Data backup and recovery plans</li>
                  <li>Vendor security assessments</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have several rights regarding your personal information:
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-[#075b7d] pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access and Portability</h3>
                <p className="text-gray-700 text-sm">
                  You can access, download, and export your personal information through your account settings or by contacting us.
                </p>
              </div>
              
              <div className="border-l-4 border-[#075b7d] pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Correction and Updates</h3>
                <p className="text-gray-700 text-sm">
                  You can update your personal information through your account settings at any time.
                </p>
              </div>
              
              <div className="border-l-4 border-[#075b7d] pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deletion</h3>
                <p className="text-gray-700 text-sm">
                  You can request deletion of your account and personal information, subject to legal retention requirements.
                </p>
              </div>
              
              <div className="border-l-4 border-[#075b7d] pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Communications</h3>
                <p className="text-gray-700 text-sm">
                  You can opt out of marketing emails by clicking the unsubscribe link or updating your preferences.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cookie Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Purpose</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Essential</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Authentication, security, and core functionality</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Session/Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Analytics</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Usage patterns and performance monitoring</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Up to 2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Remember your settings and preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Up to 1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-gray-700 text-sm mt-4">
              You can control cookies through your browser settings, but disabling certain cookies may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Account Information:</strong> Until account deletion + 30 days</li>
              <li><strong>Payment Records:</strong> 7 years for tax and accounting purposes</li>
              <li><strong>Usage Logs:</strong> Up to 2 years for analytics and security</li>
              <li><strong>Support Communications:</strong> 3 years from last interaction</li>
              <li><strong>Marketing Data:</strong> Until opt-out + 30 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our services are hosted in the United States. If you are accessing our services from outside the US, your information may be transferred to and processed in the United States.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate safeguards for international transfers, including standard contractual clauses and ensuring adequate protection levels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Sending an email notification to registered users</li>
              <li>Displaying a notice in the application</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">General Inquiries</h3>
                  <p className="text-gray-700 text-sm">Email: privacy@mocksurvey365.com</p>
                  <p className="text-gray-700 text-sm">Phone: 1-800-SURVEY-365</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                  <p className="text-gray-700 text-sm">Email: dpo@mocksurvey365.com</p>
                  <p className="text-gray-700 text-sm">Response time: 5 business days</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-700 text-sm">
                  <strong>Mailing Address:</strong><br />
                  MockSurvey365 Privacy Team<br />
                  123 Healthcare Blvd, Suite 456<br />
                  Medical City, HC 12345
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Eye className="w-4 h-4" />
            <span>Your privacy is our priority. We are committed to transparent data practices.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 