import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Header } from './Header';

const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .grid-background {
          position: relative;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 50px 50px;
          background-attachment: fixed;
        }
        
        .grid-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
      
      <Header />
      
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-12 mt-14">
          <div className="flex items-center justify-between mb-12">
            <Link
              to="/home"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* FAQ Hero Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900 grid-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
              <HelpCircle className="w-5 h-5 text-white" />
              <span className="text-white font-medium">FAQ</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Find quick answers to common questions about Vamory
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-black grid-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How do I get started with Vamory?
              </h3>
              <p className="text-gray-400">
                Simply sign up for an account and start uploading your photos. Our AI will automatically analyze and organize them for easy searching.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What file formats are supported?
              </h3>
              <p className="text-gray-400">
                We support all major image formats including JPEG, PNG, HEIC, RAW files, and more. We're constantly adding support for new formats.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Is my data secure and private?
              </h3>
              <p className="text-gray-400">
                Absolutely. We use enterprise-grade encryption and security measures to protect your photos. Your data is never shared or used for training AI models without your consent.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Can I migrate from other photo services?
              </h3>
              <p className="text-gray-400">
                Yes! We offer seamless migration from Google Photos, iCloud, and other popular photo services. Contact us for help with large migrations.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How does the credit system work?
              </h3>
              <p className="text-gray-400">
                Vamory uses a pay-as-you-go credit system. You purchase credits and your usage is automatically deducted from your balance. Only pay for what you actually use with no monthly commitments.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What happens when my credits reach zero?
              </h3>
              <p className="text-gray-400">
                When your credits reach zero, you won't be able to upload new files or create new folders. Your existing data remains accessible, but if you don't add more credits, your data will be deleted after 2 months to free up storage space.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What is Archive Storage?
              </h3>
              <p className="text-gray-400">
                Archive storage is a cost-effective option for long-term data storage. Everything you upload can be archived, which costs 10x less than standard storage. However, archived data cannot be accessed immediately - you need to make a request, and after 2 days, you'll be able to view your archived data. Perfect for backup files, old photos, and data you don't need frequent access to.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How does AI search work?
              </h3>
              <p className="text-gray-400">
                Our AI-powered search uses advanced machine learning to understand the content of your photos. You can search using natural language like "Alice reading book on bed" or "man wearing green t-shirt" and find relevant photos instantly.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Can I share my photos with others?
              </h3>
              <p className="text-gray-400">
                Yes! You can create public share links instantly or send private invitations to specific users. You can set view-only or edit permissions and track who has access to your folders. Access can be revoked anytime with one click.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Does Vamory automatically detect duplicates?
              </h3>
              <p className="text-gray-400">
                Yes! Our smart deduplication system scans files using content-based hashing to detect exact and similar duplicates. It prevents duplicate uploads automatically, saving storage space and keeping your library clean.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What platforms is Vamory available on?
              </h3>
              <p className="text-gray-400">
                Vamory is available on web browsers (Chrome, Safari, Firefox), iOS and Android mobile apps, Windows, macOS, and Linux desktop applications. All your data syncs in real-time across all devices.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How do I contact support?
              </h3>
              <p className="text-gray-400">
                You can reach our support team at support@vamory.vadaevri.com. We typically respond within 24 hours. You can also use the contact form on our website for technical issues, feature requests, or account help.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                What is the minimum billable storage size?
              </h3>
              <p className="text-gray-400">
                Files smaller than 128KB will be billed as if they were 128KB in size. This ensures fair pricing for very small files while maintaining our cost-effective storage model.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Are there additional charges for thumbnails?
              </h3>
              <p className="text-gray-400">
                Yes, each file requires a thumbnail for display purposes, and thumbnail charges will be added to your total bill. This ensures you can preview your files in the gallery interface.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
