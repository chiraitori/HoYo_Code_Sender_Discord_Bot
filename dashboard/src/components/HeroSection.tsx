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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-24 pt-24">
      {/* Aurora background */}
      <Aurora
        colorStops={["rgb(111, 98, 157)", "rgb(60, 69, 128)", "rgb(39, 37, 91)"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Main heading */}
        <h1 className="text-6xl md:text-8xl font-black mb-6">
          <span 
            className="bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgb(213, 203, 225), rgb(154, 145, 193), rgb(213, 203, 225))`
            }}
          >
            HoYo Code
          </span>
          <br />
          <span 
            className="bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgb(154, 145, 193), rgb(111, 98, 157), rgb(154, 145, 193))`
            }}
          >
            Sender
          </span>
        </h1>

        {/* Animated subtitle */}
        <p className="text-2xl md:text-3xl mb-8 font-light" style={{ color: 'rgb(154, 145, 193)' }}>
          {isMounted ? animatedText : fullText}
          {isMounted && <span className="animate-pulse">|</span>}
        </p>

        {/* Description */}
        <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
          Automatically fetch and distribute HoYoverse game redemption codes to your Discord server. 
          Support for <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}>Genshin Impact</span>, 
          <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}> Honkai: Star Rail</span>, and 
          <span className="font-semibold" style={{ color: 'rgb(154, 145, 193)' }}> Zenless Zone Zero</span>.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mb-16">
          <a
            href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
            style={{ 
              background: `linear-gradient(to right, rgb(111, 98, 157), rgb(154, 145, 193))`,
              color: 'rgb(213, 203, 225)'
            }}
          >
            <span className="flex items-center space-x-3">
              <span>🚀 Add to Discord</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
          
          <a
            href="/codes"
            className="group border-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300"
            style={{ 
              borderColor: 'rgba(154, 145, 193, 0.5)',
              color: 'rgb(154, 145, 193)'
            }}
          >
            <span className="flex items-center space-x-3">
              <span>📋 View Live Codes</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
        </div>

        {/* Game icons */}
        <div className="flex items-center justify-center space-x-8 opacity-80">
          <div className="animate-bounce delay-0">
            <GameIcon gameId="genshin" size={64} />
          </div>
          <div className="animate-bounce delay-200">
            <GameIcon gameId="hsr" size={64} />
          </div>
          <div className="animate-bounce delay-400">
            <GameIcon gameId="zzz" size={64} />
          </div>
        </div>
      </div>
    </div>
  );
}
