// src/components/landing/Hero.jsx - UPDATED WITH BOTH BUTTONS
import { Heart, ArrowDown } from 'lucide-react';

export default function Hero() {
  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    // Trigger the Get Started button in Header to open modal
    const getStartedBtn = document.querySelector('[data-get-started]');
    if (getStartedBtn) {
      getStartedBtn.click();
    }
  };

  return (
    <section className="relative h-screen flex items-center overflow-hidden pt-20">
      {/* Full-bleed background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=1920&q=80" 
          alt="Expecting mother in golden hour sunlight"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/50 to-transparent" />
      </div>
      
      {/* Wavy bottom divider */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg className="w-full h-24 md:h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" 
                fill="#F8F5F0" opacity="1" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="max-w-2xl space-y-6">
          {/* Small badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Heart className="w-4 h-4 text-terracotta" fill="currentColor" strokeWidth={0} />
            <span className="text-sm text-white font-medium tracking-wide">
              Nurture & Nest
            </span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight">
            Embracing Your Journey to Motherhood
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed">
            Holistic support, expert guidance, and a community for growth and comfort.
          </p>
          
          {/* CTA Buttons - BOTH BUTTONS RESTORED */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-terracotta hover:bg-terracotta-dark text-white font-semibold rounded-soft shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Join Our Nest
            </button>
            <button 
              onClick={handleLearnMore}
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-soft border border-white/30 transition-all duration-300"
            >
              Learn More
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-12 pt-8">
            <div>
              <p className="text-4xl font-serif text-terracotta font-bold">3X</p>
              <p className="text-sm text-white/80 mt-1">Lower mortality risk</p>
            </div>
            <div>
              <p className="text-4xl font-serif text-terracotta font-bold">70%</p>
              <p className="text-sm text-white/80 mt-1">Women without smartphones</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-white/60" strokeWidth={1.5} />
      </div>
    </section>
  );
}
