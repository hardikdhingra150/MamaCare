// src/components/landing/Features.jsx
import { Sprout, Heart, Baby } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Features() {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-cream-dark relative">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-16 mb-20">
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Sprout className="w-12 h-12 text-sage group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-charcoal">Growth & Wellness</h3>
          </div>
          
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-12 h-12 text-terracotta group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-charcoal">Empathetic Support</h3>
          </div>
          
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Baby className="w-12 h-12 text-sage group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-charcoal">Safe Beginnings</h3>
          </div>
        </div>
        
        {/* Content with image */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="relative">
            <div className="rounded-soft overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80" 
                alt="Gentle hands on pregnant belly with tea"
                className="w-full h-[500px] object-cover"
              />
            </div>
            {/* Decorative blob */}
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-sage/20 rounded-full blur-3xl -z-10" />
          </div>
          
          {/* Right: Text */}
          <div className="space-y-6">
            <p className="text-terracotta uppercase tracking-wider text-sm font-semibold">
              Our Mission
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-charcoal leading-tight">
              Nurturing Rural Mothers Through Technology
            </h2>
            <p className="text-lg text-charcoal/70 leading-relaxed">
              In rural India, maternal mortality rates are 3x higher than urban areas. 
              70% of women don't own smartphones, leaving them disconnected from 
              critical pregnancy guidance and emergency support.
            </p>
            <p className="text-lg text-charcoal/70 leading-relaxed">
              Our solution bridges this gap with a simple voice-based IVR system, 
              AI-powered risk detection, and ASHA worker integration—bringing 
              modern healthcare to every doorstep.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary mt-4"
            >
              Discover Our Approach →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
