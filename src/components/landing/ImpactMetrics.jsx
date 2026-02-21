// src/components/landing/ImpactMetrics.jsx - NEW FILE
import { TrendingUp, Users, Heart, Phone } from 'lucide-react';

export default function ImpactMetrics() {
    <section id="impact" className="py-24 bg-gradient-to-br from-sage/5 via-cream to-terracotta/5"></section>
  const metrics = [
    {
      icon: Users,
      number: '10,000+',
      label: 'Mothers Registered',
      description: 'Across rural India',
      color: 'sage'
    },
    {
      icon: Heart,
      number: '95%',
      label: 'Successful Deliveries',
      description: 'With our monitoring',
      color: 'terracotta'
    },
    {
      icon: Phone,
      number: '50,000+',
      label: 'Health Tips Delivered',
      description: 'Via voice calls',
      color: 'sage'
    },
    {
      icon: TrendingUp,
      number: '3X',
      label: 'Lower Risk Rate',
      description: 'Compared to unmonitored',
      color: 'terracotta'
    }
  ];

  return (
    
    <section className="py-24 bg-gradient-to-br from-sage/5 via-cream to-terracotta/5">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-terracotta uppercase tracking-wider text-sm font-semibold mb-3">
            Our Impact
          </p>
          <h2 className="text-4xl md:text-5xl font-serif text-charcoal leading-tight mb-4">
            Making a Real Difference
          </h2>
          <p className="text-lg text-charcoal/70 max-w-2xl mx-auto">
            Empowering rural communities with accessible maternal healthcare through technology
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            const colorClasses = metric.color === 'sage' 
              ? 'from-sage to-sage-dark' 
              : 'from-terracotta to-terracotta-dark';
            
            return (
              <div 
                key={idx}
                className="card text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClasses} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-4xl md:text-5xl font-serif font-bold text-charcoal mb-2">
                  {metric.number}
                </p>
                <p className="text-lg font-semibold text-charcoal mb-1">
                  {metric.label}
                </p>
                <p className="text-sm text-charcoal/60">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-charcoal/70 mb-6">
           
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Start Your Journey →
          </button>
        </div>
      </div>
    </section>
  );
}
