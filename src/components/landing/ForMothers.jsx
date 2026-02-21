// src/components/landing/ForMothers.jsx - CREATE NEW FILE
import { Phone, Heart, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForMothers() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Phone,
      title: 'Voice Call Support',
      description: 'Receive weekly health tips in Hindi, Punjabi, or English via phone calls - no app needed'
    },
    {
      icon: Calendar,
      title: 'Checkup Reminders',
      description: 'Never miss an important checkup with automated reminders before your appointment'
    },
    {
      icon: Heart,
      title: '24/7 Emergency Help',
      description: 'One call away from emergency support and ambulance services anytime you need'
    },
    {
      icon: Shield,
      title: 'Health Monitoring',
      description: 'Your ASHA worker tracks your vitals and alerts you if anything needs attention'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-terracotta/5 via-cream to-sage/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sage/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta/10 border border-terracotta/20 mb-4">
            <Heart className="w-4 h-4 text-terracotta" fill="currentColor" strokeWidth={0} />
            <span className="text-sm text-terracotta font-semibold">For Expecting Mothers</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-charcoal leading-tight mb-4">
            Care That Comes to You
          </h2>
          <p className="text-lg text-charcoal/70 max-w-2xl mx-auto">
            No smartphone? No problem. Get expert maternal care support through simple phone calls
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className="card group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors flex-shrink-0">
                    <Icon className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-charcoal mb-2">{feature.title}</h3>
                    <p className="text-charcoal/70">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Box */}
        <div className="card bg-gradient-to-r from-terracotta to-terracotta-dark text-white text-center max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-serif mb-3">Ready to Get Started?</h3>
            <p className="text-white/90 text-lg mb-2">
              Register now and start receiving personalized care
            </p>
            <p className="text-white/80 mb-6">
              Or call our toll-free number: <strong className="text-white text-xl">1800-123-4567</strong>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/patient-portal')}
              className="px-8 py-4 bg-white text-terracotta hover:bg-cream font-semibold rounded-soft transition-colors shadow-lg"
            >
              Register Online
            </button>
            <a 
              href="tel:18001234567"
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-soft border border-white/30 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-white/80 text-sm">
              ✅ Free service • ✅ Available in Hindi, Punjabi & English • ✅ No smartphone required
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <p className="text-3xl font-serif font-bold text-terracotta mb-1">10,000+</p>
            <p className="text-sm text-charcoal/70">Mothers Trust Us</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-terracotta mb-1">15 States</p>
            <p className="text-sm text-charcoal/70">Across India</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-terracotta mb-1">24/7</p>
            <p className="text-sm text-charcoal/70">Support Available</p>
          </div>
        </div>
      </div>
    </section>
  );
}
