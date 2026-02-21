// src/components/landing/Statistics.jsx
import { Users, HeartPulse, Phone, MapPin } from 'lucide-react';

export default function Statistics() {
  const stats = [
    {
      icon: Users,
      number: '10,000+',
      label: 'Mothers Supported',
      color: 'text-terracotta',
    },
    {
      icon: HeartPulse,
      number: '95%',
      label: 'Risk Detection Accuracy',
      color: 'text-sage',
    },
    {
      icon: Phone,
      number: '50,000+',
      label: 'IVR Calls Completed',
      color: 'text-gold',
    },
    {
      icon: MapPin,
      number: '250+',
      label: 'Villages Covered',
      color: 'text-terracotta',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-sage/10 via-cream to-terracotta/10">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <div className="text-center mb-16">
          <p className="text-terracotta uppercase tracking-wider text-sm font-semibold mb-3">
            Our Impact
          </p>
          <h2 className="text-4xl md:text-5xl font-serif text-charcoal mb-4">
            Transforming Maternal Healthcare
          </h2>
          <p className="text-lg text-charcoal/70 max-w-3xl mx-auto">
            Every number represents a life touched, a mother empowered, and a community strengthened
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-soft p-8 text-center shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-cream-dark flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <p className="text-4xl font-serif font-bold text-charcoal mb-2">{stat.number}</p>
              <p className="text-sm text-charcoal/60 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
