// src/components/landing/CallToAction.jsx
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CallToAction() {
  const navigate = useNavigate();

  const handleScheduleDemo = () => {
    alert('📅 Demo scheduling feature coming soon!\n\nFor now, please contact us at:\n📞 +1 970-436-8891\n📧 support@maternalcare.org');
  };

  return (
    <section className="py-24 bg-gradient-to-br from-sage to-sage-dark text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-terracotta/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">
            Ready to Transform Maternal Healthcare?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join hundreds of ASHA workers and health centers already using our platform 
            to save lives and empower mothers across rural India.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-terracotta hover:bg-terracotta-dark text-white font-semibold rounded-soft shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleScheduleDemo}
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-soft border border-white/30 transition-all duration-300"
            >
              Schedule Demo
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-8 pt-8 border-t border-white/20">
            <a 
              href="tel:+1 970-436-8891" 
              className="flex items-center justify-center gap-3 hover:text-white transition-colors"
            >
              <Phone className="w-5 h-5 text-white/70" />
              <span className="text-white/90">+1 970-436-8891 (Toll-free)</span>
            </a>
            <a 
              href="mailto:support@maternalcare.org"
              className="flex items-center justify-center gap-3 hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5 text-white/70" />
              <span className="text-white/90">support@maternalcare.org</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
