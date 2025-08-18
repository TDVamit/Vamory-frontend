import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {

  return (
    <footer className="bg-black border-t border-white/10">


      {/* Footer Navigation */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/VD Logo Funky.png" alt="Vamory Logo" className="w-8 h-8 object-contain" />
              <span className="text-white font-semibold text-lg">Vamory</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
              <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2024 Vamory. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
