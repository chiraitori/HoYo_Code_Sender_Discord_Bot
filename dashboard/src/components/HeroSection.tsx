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
      {/* Aurora background - using clearer, brighter colors */}
      <Aurora
        colorStops={["#4b1ec8", "#00f0ff", "#ff3c96"]}
        blend={0.6}
        amplitude={1.2}
        speed={0.4}
      />

      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto">
        {/* Main heading */}
        <div className="mb-6 sm:mb-8 space-y-2">
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tight leading-none">
            <span className="text-gradient block drop-shadow-lg">
              HoYo Code
            </span>
            <span className="text-gradient-accent block drop-shadow-2xl">
              Sender
            </span>
          </h1>
        </div>

        {/* Animated subtitle */}
        <p className="text-xl sm:text-2xl md:text-4xl mb-8 sm:mb-10 font-bold tracking-wide h-12 flex items-center justify-center space-x-2" style={{ color: 'var(--color-violet-200)' }}>
          <span suppressHydrationWarning className="drop-shadow-md">
            {isMounted ? animatedText : fullText}
          </span>
          {isMounted && <span className="animate-pulse text-cyan-400">|</span>}
        </p>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl mb-10 sm:mb-14 max-w-3xl mx-auto leading-relaxed px-4 text-violet-100/80 font-medium">
          Automatically fetch and distribute HoYoverse game redemption codes to your Discord server.
          Support for <span className="text-violet-50 font-bold border-b border-cyan-400/30">Genshin Impact</span>,
          <span className="text-violet-50 font-bold border-b border-cyan-400/30 mx-1">Honkai: Star Rail</span>, and
          <span className="text-violet-50 font-bold border-b border-cyan-400/30">Zenless Zone Zero</span>.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center mb-12 sm:mb-20 px-4">
          <a
            href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
            target="_blank"
            rel="noopener noreferrer"
            className="group glass-button px-8 py-4 rounded-full font-bold text-lg w-full sm:w-auto min-w-[200px]"
            style={{
              background: 'linear-gradient(135deg, rgba(110, 60, 255, 0.5), rgba(0, 240, 255, 0.2))',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="flex items-center justify-center space-x-3 text-white">
              <span>🚀 Add to Discord</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>

          <a
            href="/codes"
            className="group glass-button px-8 py-4 rounded-full font-bold text-lg w-full sm:w-auto min-w-[200px]"
          >
            <span className="flex items-center justify-center space-x-3 text-violet-100 group-hover:text-white transition-colors">
              <span>📋 View Live Codes</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
        </div>

        {/* Game icons */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 opacity-90">
          <div className="animate-bounce hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(110,60,255,0.5)]">
            <GameIcon gameId="genshin" size={40} className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="animate-bounce delay-150 hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            <GameIcon gameId="hsr" size={40} className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="animate-bounce delay-300 hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,60,150,0.5)]">
            <GameIcon gameId="zzz" size={40} className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
