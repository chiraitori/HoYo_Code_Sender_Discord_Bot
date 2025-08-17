'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBotStats } from '@/lib/BotStatsContext';
import GameIcon from './GameIcon';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2025); // Default year to prevent hydration mismatch
  const { stats: botStatsData } = useBotStats();
  const [botStats, setBotStats] = useState<{ servers: number; uptime: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (botStatsData) {
      setBotStats({
        servers: botStatsData.guildCount || botStatsData.servers || 0,
        uptime: 'Online' // Simplified uptime display
      });
    }
  }, [botStatsData]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <footer className="border-t relative z-20" style={{ 
      background: 'linear-gradient(to top, var(--color-purple-950), var(--color-purple-900))',
      borderColor: 'rgba(111, 98, 157, 0.3)'
    }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-4xl">🎮</div>
              <span className="text-2xl font-bold" style={{ 
                backgroundImage: `linear-gradient(to right, rgb(213, 203, 225), rgb(154, 145, 193))`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                HoYo Code Sender
              </span>
            </div>
            <p className="mb-6 max-w-md leading-relaxed" style={{ color: 'rgba(213, 203, 225, 0.7)' }}>
              The most reliable Discord bot for HoYoverse game redemption codes. 
              Never miss free Primogems, Stellar Jade, Polychrome or exclusive rewards again.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-100/60 hover:text-purple-100 transition-colors"
                title="View on GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://discord.gg/DtuKCEkXzY" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-100/60 hover:text-purple-100 transition-colors"
                title="Join our Discord"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a 
                href="https://top.gg/bot/1124167011585511516/vote"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-100/60 hover:text-purple-100 transition-colors"
                title="Vote on top.gg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="144 247 511.711 325" fill="currentColor">
                  {/* Right */}
                  <path d="M655.711 247H330.71V572H397.113C422.599 572 447.042 561.876 465.064 543.854C483.086 525.832 493.21 501.389 493.21 475.902V409.5H559.613C585.099 409.5 609.542 399.375 627.564 381.354C645.586 363.332 655.711 338.889 655.711 313.402V247Z"/>
                  {/* Left */}
                  <path d="M144 247H306.5V409.5H193.657C180.531 409.5 167.943 404.286 158.661 395.004C149.379 385.722 144.165 373.134 144.165 360.008L144 247Z"/>
                </svg>
              </a>
            </div>
            {botStats && (
              <div className="mt-4 text-xs text-purple-100/50">
                Active in {botStats.servers.toLocaleString()} servers • Uptime: {botStats.uptime}
              </div>
            )}
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-purple-50 mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => handleNavigation('/codes')}
                  className="text-purple-100/70 hover:text-purple-100 transition-colors text-left w-full"
                >
                  Live Codes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/commands')}
                  className="text-purple-100/70 hover:text-purple-100 transition-colors text-left w-full"
                >
                  Commands
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/servers')}
                  className="text-purple-100/70 hover:text-purple-100 transition-colors text-left w-full"
                >
                  Manage Servers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/dashboard')}
                  className="text-purple-100/70 hover:text-purple-100 transition-colors text-left w-full"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <a 
                  href="https://discord.gg/DtuKCEkXzY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-100/70 hover:text-purple-100 transition-colors block"
                >
                  Support Server
                </a>
              </li>
            </ul>
          </div>
          
          {/* Games & Features */}
          <div>
            <h3 className="font-bold text-purple-50 mb-4">Features</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <span>🎮</span>
                <span className="text-purple-100/70">Auto Code Sending</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⚡</span>
                <span className="text-purple-100/70">Real-time Updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🔧</span>
                <span className="text-purple-100/70">Easy Setup</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📱</span>
                <span className="text-purple-100/70">Mobile Friendly</span>
              </li>
            </ul>
            
            <h4 className="font-semibold text-purple-50 mt-6 mb-3">Supported Games</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <GameIcon gameId="genshin" size={20} />
                <span className="text-purple-100/70">Genshin Impact</span>
                <a href="https://genshin.hoyoverse.com" target="_blank" rel="noopener noreferrer" className="text-purple-100/70 hover:text-purple-100 transition-colors">
                  Official Site
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <GameIcon gameId="hsr" size={20} />
                <span className="text-purple-100/70">Honkai: Star Rail</span>
                <a href="https://hsr.hoyoverse.com" target="_blank" rel="noopener noreferrer" className="text-purple-100/70 hover:text-purple-100 transition-colors">
                  Official Site
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <GameIcon gameId="zzz" size={20} />
                <span className="text-purple-100/70">Zenless Zone Zero</span>
                <a href="https://zenless.hoyoverse.com" target="_blank" rel="noopener noreferrer" className="text-purple-100/70 hover:text-purple-100 transition-colors">
                  Official Site
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-purple-300/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-purple-100/60 text-sm mb-4 md:mb-0">
              &copy; {currentYear} Chiraitori. Not affiliated with HoYoverse.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <button 
                onClick={() => handleNavigation('/privacy')}
                className="text-purple-100/60 hover:text-purple-100 transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => handleNavigation('/terms')}
                className="text-purple-100/60 hover:text-purple-100 transition-colors"
              >
                Terms of Service
              </button>
              <a 
                href="https://uptime-chika-alpine.fly.dev/status/hoyo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-purple-100/60 hover:text-purple-100 transition-colors"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Status Page</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
