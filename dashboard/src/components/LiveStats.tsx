'use client';

import { useState, useEffect } from 'react';
import { useBotStats } from '@/lib/BotStatsContext';

interface BotStats {
  guildCount: number;
  userCount: number;
  channelCount: number;
  uptime: number;
  ping: number;
  status: number;
  botUser: {
    username: string;
    avatar: string;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (num: number) => string;
}

function AnimatedNumber({ value, duration = 2000, formatter = (num) => num.toLocaleString() }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || value === 0) return;
    
    const startTime = performance.now(); // Use performance.now() instead of Date.now()
    const startValue = 0;
    const difference = value - startValue;

    const updateValue = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + difference * easeOutQuart);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    // Reset to 0 and start animation only after mount
    setDisplayValue(0);
    requestAnimationFrame(updateValue);
  }, [value, duration, isMounted]);

  return <span suppressHydrationWarning>{formatter(isMounted ? displayValue : value)}</span>;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function StatsOverview() {
  const { stats, loading, error } = useBotStats();

  if (loading) {
    return (
      <section className="py-16" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(154, 145, 193)' }}>Bot Statistics</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'rgb(111, 98, 157)' }}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 sm:pt-16 pb-4 sm:pb-16 px-2 sm:px-4" style={{ background: 'transparent' }}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4" style={{ color: 'rgb(154, 145, 193)' }}>Live Bot Statistics</h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm lg:text-base px-2" style={{ color: 'rgb(213, 203, 225)' }}>
            Real-time statistics from your Discord bot showing current performance and reach
          </p>
          {error && (
            <div className="mt-4 p-3 border rounded-lg inline-block" style={{
              background: 'rgba(245, 158, 11, 0.2)',
              borderColor: 'rgb(245, 158, 11)',
              color: 'rgb(245, 158, 11)'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {stats ? (
          <>
            {/* Bot Info Card */}
            <div className="mb-4 sm:mb-8 max-w-sm sm:max-w-md mx-auto">
              <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-lg" style={{
                background: 'var(--gradient-card)',
                borderColor: 'rgba(111, 98, 157, 0.3)'
              }}>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {stats.botUser.avatar && stats.botUser.avatar !== '/api/placeholder/64/64' ? (
                    <img 
                      src={stats.botUser.avatar} 
                      alt="Bot Avatar" 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2" 
                      style={{ borderColor: 'rgb(111, 98, 157)' }}
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold"
                      style={{ background: 'linear-gradient(to bottom right, rgb(111, 98, 157), rgb(60, 69, 128))' }}
                    >
                      🤖
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'rgb(154, 145, 193)' }}>{stats.botUser.username}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stats.status === 0 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                      <span className="text-xs sm:text-sm" style={{ color: 'rgb(111, 98, 157)' }}>
                        {stats.status === 0 ? 'Online' : 'Offline'} • {stats.ping}ms ping
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 mb-4 sm:mb-8">
              <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{
                background: 'var(--gradient-card)',
                borderColor: 'rgba(111, 98, 157, 0.3)'
              }}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4">🏰</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2" style={{ color: 'rgb(154, 145, 193)' }}>
                    <AnimatedNumber value={stats.guildCount} />
                  </div>
                  <div className="font-medium text-sm sm:text-base" style={{ color: 'rgb(213, 203, 225)' }}>Discord Servers</div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-2" style={{ color: 'rgb(111, 98, 157)' }}>Active Communities</div>
                </div>
              </div>

              <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{
                background: 'var(--gradient-card)',
                borderColor: 'rgba(111, 98, 157, 0.3)'
              }}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4">👥</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2" style={{ color: 'rgb(154, 145, 193)' }}>
                    <AnimatedNumber value={stats.userCount} />
                  </div>
                  <div className="font-medium text-sm sm:text-base" style={{ color: 'rgb(213, 203, 225)' }}>Total Users</div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-2" style={{ color: 'rgb(111, 98, 157)' }}>Getting Free Codes</div>
                </div>
              </div>

              <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1" style={{
                background: 'var(--gradient-card)',
                borderColor: 'rgba(111, 98, 157, 0.3)'
              }}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4">⏱️</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2" style={{ color: 'rgb(154, 145, 193)' }}>
                    {formatUptime(stats.uptime)}
                  </div>
                  <div className="font-medium text-sm sm:text-base" style={{ color: 'rgb(213, 203, 225)' }}>Uptime</div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-2" style={{ color: 'rgb(111, 98, 157)' }}>Continuous Service</div>
                </div>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(154, 145, 193)' }}>Bot Not Available</h3>
            <p className="max-w-md mx-auto" style={{ color: 'rgb(111, 98, 157)' }}>
              Please start the main Discord bot application to view live statistics.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
