// src/components/landing/Footer.jsx
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/70">
      <div className="container mx-auto px-6 md:px-12 lg:px-20 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-terracotta" fill="currentColor" strokeWidth={0} />
              <span className="text-xl font-serif text-white">Nurture & Nest</span>
            </div>
            <p className="text-sm leading-relaxed">
              Empowering rural mothers through accessible technology and compassionate care.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-terracotta transition-colors flex items-center justify-center">
                <Facebook className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-terracotta transition-colors flex items-center justify-center">
                <Twitter className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-terracotta transition-colors flex items-center justify-center">
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-terracotta transition-colors flex items-center justify-center">
                <Linkedin className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For ASHA Workers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Impact Stories</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Training Materials</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm">1800-123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm">support@maternalcare.org</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm">New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © 2026 Nurture & Nest. All rights reserved.
          </p>
          <p className="text-sm">
            Built with <Heart className="w-4 h-4 inline text-terracotta" fill="currentColor" strokeWidth={0} /> for rural India
          </p>
        </div>
      </div>
    </footer>
  );
}
