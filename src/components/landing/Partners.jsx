// src/components/landing/Partners.jsx - NEW FILE
import { Building2 } from 'lucide-react';

export default function Partners() {
    <section id="partners" className="py-24 bg-white"></section>
  const partners = [
    'Ministry of Health',
    'UNICEF India',
    'WHO India',
    'Bill & Melinda Gates Foundation',
    'Government of India',
    'National Health Mission'
  ];

  const recognitions = [
    {
      title: 'Best Healthcare Innovation 2025',
      org: 'Government of India',
      icon: '🏆'
    },
    {
      title: 'Digital India Award',
      org: 'Ministry of Electronics',
      icon: '🥇'
    },
    {
      title: 'Social Impact Prize',
      org: 'UN Women',
      icon: '⭐'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {/* Partners Section */}
        <div className="text-center mb-16">
          <p className="text-sage uppercase tracking-wider text-sm font-semibold mb-3">
            Trusted By
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-12">
            Our Partners & Supporters
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {partners.map((partner, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-center p-6 bg-cream hover:bg-cream-dark rounded-gentle transition-colors group"
              >
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-sage/40 mx-auto mb-2 group-hover:text-sage transition-colors" />
                  <p className="text-sm font-medium text-charcoal/70 group-hover:text-charcoal transition-colors">
                    {partner}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recognition Section */}
        <div className="mt-20">
          <h3 className="text-2xl md:text-3xl font-serif text-charcoal text-center mb-10">
            Recognition & Awards
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {recognitions.map((item, idx) => (
              <div 
                key={idx}
                className="card text-center hover:shadow-lg transition-all duration-300 border-l-4 border-terracotta"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h4 className="text-lg font-serif text-charcoal mb-2">{item.title}</h4>
                <p className="text-sm text-charcoal/60">{item.org}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 p-8 bg-gradient-to-r from-sage to-sage-dark rounded-soft text-white text-center">
          <p className="text-lg mb-2">Deployed across</p>
          <p className="text-4xl font-serif font-bold mb-1">15 States</p>
          <p className="text-white/80">Covering 500+ Villages in Rural India</p>
        </div>
      </div>
    </section>
  );
}
