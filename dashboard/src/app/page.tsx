'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import LiveStats from '@/components/LiveStats';
import GameShowcase from '@/components/GameShowcase';
import FeaturesGrid from '@/components/FeaturesGrid';
import FluidGlassHeader from '@/components/FluidGlassHeader';
import Footer from '@/components/Footer';

export default function Home() {
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide arrow after scrolling past 110% of viewport height
      const scrolled = window.scrollY > window.innerHeight * 1.1;
      setShowScrollArrow(!scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToStats = () => {
    // Scroll to LiveStats section
    const statsSection = document.querySelector('section:nth-of-type(1)'); // LiveStats is first section
    if (statsSection) {
      statsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
      <FluidGlassHeader />
      <main className="relative z-10">
        <HeroSection />
        <LiveStats />
        <GameShowcase />
        <FeaturesGrid />
      </main>
      
      {/* Scroll indicator positioned at bottom of viewport */}
      {showScrollArrow && (
        <button 
          onClick={scrollToStats}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-vietnamese-purple-400 rounded-full p-2"
          aria-label="Scroll to statistics"
        >
          <div className="animate-bounce">
            <svg className="w-8 h-8" style={{ color: 'rgb(154, 145, 193)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>
      )}
      
      <Footer />
    </div>
  );
}
