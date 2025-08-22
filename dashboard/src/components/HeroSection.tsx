'use client';

import { useState, useEffect } from 'react';
import Aurora from './Aurora';
import GameIcon from './GameIcon';

export default function HeroSection() {
  const [animatedText, setAnimatedText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const fullText = 'Never miss a code again';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setAnimatedText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isMounted]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-16 sm:-mt-20 pt-16 sm:pt-20">
      {/* Aurora background */}
      <Aurora
        colorStops={["#6f629d", "#3c4580", "#27255b"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      <div className="relative z-10 text-center px-2 sm:px-4 max-w-6xl mx-auto">
        {/* Main heading */}
        <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 leading-tight">
          <span 
            className="bg-clip-text text-transparent block"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgb(213, 203, 225), rgb(154, 145, 193), rgb(213, 203, 225))`
            }}
          >
            HoYo Code
          </span>
          <span 
            className="bg-clip-text text-transparent block"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgb(154, 145, 193), rgb(111, 98, 157), rgb(154, 145, 193))`
            }}
          >
            Sender
          </span>
        </h1>

        {/* Animated subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 font-light px-2 sm:px-4" style={{ color: 'rgb(154, 145, 193)' }}>
          <span suppressHydrationWarning>
            {isMounted ? animatedText : fullText}
          </span>
          {isMounted && <span className="animate-pulse">|</span>}
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
          Automatically fetch and distribute HoYoverse game redemption codes to your Discord server. 
          Support for <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}>Genshin Impact</span>, 
          <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}> Honkai: Star Rail</span>, and 
          <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}> Zenless Zone Zero</span>.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 items-center justify-center mb-8 sm:mb-16 px-2 sm:px-4">
          <a
            href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl text-center"
            style={{ 
              background: `linear-gradient(to right, rgb(111, 98, 157), rgb(154, 145, 193))`,
              color: 'rgb(213, 203, 225)'
            }}
          >
            <span className="flex items-center justify-center space-x-3">
              <span>🚀 Add to Discord</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
          
          <a
            href="/codes"
            className="group border-2 w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 text-center"
            style={{ 
              borderColor: 'rgba(154, 145, 193, 0.5)',
              color: 'rgb(154, 145, 193)'
            }}
          >
            <span className="flex items-center justify-center space-x-3">
              <span>📋 View Live Codes</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
        </div>

        {/* Game icons */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-6 lg:space-x-8 opacity-80">
          <div className="animate-bounce delay-0">
            <GameIcon gameId="genshin" size={40} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
          </div>
          <div className="animate-bounce delay-200">
            <GameIcon gameId="hsr" size={40} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
          </div>
          <div className="animate-bounce delay-400">
            <GameIcon gameId="zzz" size={40} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
