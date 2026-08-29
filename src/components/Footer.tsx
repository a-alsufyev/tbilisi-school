import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Github } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('about.title') || 'About Us'}</h3>
            <p className="text-gray-600 mb-6">
              Helping parents find the best international education for their children in Tbilisi.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-500">
                <Mail className="w-4 h-4" />
                <span>contact@tbilisischools.ge</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <Phone className="w-4 h-4" />
                <span>+995 555 123 456</span>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Info</h3>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Cookie Settings</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Support Center</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">School Catalog</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Interactive Map</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Admission Guide</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Location & Social */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Our Office</h3>
            <div className="flex items-start gap-3 text-gray-500 mb-6">
              <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>Tbilisi, Georgia<br />Rustaveli Avenue, 1</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Tbilisi International Schools Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
