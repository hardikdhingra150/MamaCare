// src/components/landing/Header.jsx
import { useState, useEffect } from 'react';
import { Heart, Menu, X } from 'lucide-react';

export default function Header({ onOpenLogin, onOpenSignUp, onScrollTo }) {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Shrink header on scroll ──────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features',  id: 'features'     },
    { label: 'Impact',    id: 'impact'        },
    { label: 'Partners',  id: 'partners'      },
  ];

  const handleNav = (id) => {
    onScrollTo(id);
    setMobileOpen(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => onScrollTo('hero')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className={`font-serif font-bold text-lg transition-colors ${
              scrolled ? 'text-charcoal' : 'text-white'
            }`}>
              MamaCare
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-white/10 ${
                  scrolled
                    ? 'text-charcoal/70 hover:text-charcoal hover:bg-cream'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                scrolled
                  ? 'text-charcoal hover:text-sage'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={onOpenSignUp}
              className="px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-bold rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-full transition-colors ${
              scrolled ? 'text-charcoal hover:bg-cream' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-white pt-20">
          <div className="flex flex-col p-6 gap-2">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className="w-full text-left px-4 py-3.5 rounded-2xl text-charcoal font-medium hover:bg-cream transition-colors text-lg"
              >
                {link.label}
              </button>
            ))}

            <div className="border-t border-cream-dark mt-4 pt-4 space-y-3">
              <button
                onClick={() => { onOpenLogin(); setMobileOpen(false); }}
                className="w-full py-3.5 border-2 border-sage text-sage font-bold rounded-2xl hover:bg-sage hover:text-white transition-all"
              >
                Login
              </button>
              <button
                onClick={() => { onOpenSignUp(); setMobileOpen(false); }}
                className="w-full py-3.5 bg-terracotta text-white font-bold rounded-2xl hover:bg-terracotta-dark transition-all"
              >
                Get Started 🌸
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
