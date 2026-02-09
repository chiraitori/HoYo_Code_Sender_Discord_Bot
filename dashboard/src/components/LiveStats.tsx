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

    const startTime = performance.now();
    const startValue = 0;
    const difference = value - startValue;

    const updateValue = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + difference * easeOutQuart);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

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

export default function StatsOverview() {
  const { stats, loading, error } = useBotStats();

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-violet-200">Bot Statistics</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 sm:pt-16 pb-4 sm:pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            <span className="text-gradient">Live Statistics</span>
          </h2>
          <p className="max-w-2xl mx-auto text-violet-200/80 text-lg">
            Real-time performance metrics directly from the neural network
          </p>
          {error && (
            <div className="mt-6 p-4 border border-red-500/50 rounded-xl bg-red-500/10 text-red-400 inline-block font-medium">
              ⚠️ {error}
            </div>
          )}
        </div>

        {stats ? (
          <>
            {/* Bot Info Card */}
            <div className="mb-8 max-w-lg mx-auto transform hover:scale-105 transition-transform duration-500">
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-accent-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="flex items-center space-x-6 relative z-10">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-violet-500 blur-xl opacity-50 rounded-full animate-pulse"></div>
                    {stats.botUser.avatar && stats.botUser.avatar !== '/api/placeholder/64/64' ? (
                      <img
                        src={stats.botUser.avatar}
                        alt="Bot Avatar"
                        className="w-20 h-20 rounded-full border-2 border-violet-400 relative z-10 shadow-xl"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold relative z-10 shadow-xl"
                        style={{ background: 'linear-gradient(135deg, var(--color-violet-500), var(--color-violet-800))' }}
                      >
                        🤖
                      </div>
                    )}
                    {/* Status dot */}
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-violet-900 z-20 ${stats.status === 0 ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></div>
                  </div>

                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{stats.botUser.username}</h3>
                    <div className="flex items-center space-x-3 text-violet-200/80 font-mono text-sm">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {stats.status === 0 ? 'ONLINE' : 'OFFLINE'}
                      </span>
                      <span>•</span>
                      <span className={stats.ping < 100 ? 'text-green-400' : 'text-yellow-400'}>
                        {stats.ping}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Guilds Card */}
              <div className="glass-panel rounded-2xl p-8 hover:bg-white/5 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:scale-110 transition-transform duration-500">🏰</div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">🏰</div>
                  <div className="text-4xl lg:text-5xl font-black mb-2 text-white group-hover:text-cyan-400 transition-colors">
                    <AnimatedNumber value={stats.guildCount} />
                  </div>
                  <div className="text-lg font-bold text-violet-200">Discord Servers</div>
                  <div className="text-sm text-violet-400 mt-2 font-medium">TRUSTED BY COMMUNITIES</div>
                </div>
              </div>

              {/* Users Card */}
              <div className="glass-panel rounded-2xl p-8 hover:bg-white/5 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:scale-110 transition-transform duration-500">👥</div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">👥</div>
                  <div className="text-4xl lg:text-5xl font-black mb-2 text-white group-hover:text-pink-500 transition-colors">
                    <AnimatedNumber value={stats.userCount} />
                  </div>
                  <div className="text-lg font-bold text-violet-200">Total Users</div>
                  <div className="text-sm text-violet-400 mt-2 font-medium">RECEIVING REWARDS</div>
                </div>
              </div>

              {/* Uptime Card */}
              <div className="glass-panel rounded-2xl p-8 hover:bg-white/5 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:scale-110 transition-transform duration-500">⏱️</div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">⏱️</div>
                  <div className="text-4xl lg:text-5xl font-black mb-2 text-white group-hover:text-green-400 transition-colors">
                    {formatUptime(stats.uptime)}
                  </div>
                  <div className="text-lg font-bold text-violet-200">System Uptime</div>
                  <div className="text-sm text-violet-400 mt-2 font-medium">CONTINUOUS OPERATION</div>
                </div>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="text-center py-20 glass-panel rounded-3xl mx-auto max-w-2xl">
            <div className="text-7xl mb-6">🤖</div>
            <h3 className="text-2xl font-bold mb-3 text-white">Bot Not Available</h3>
            <p className="max-w-md mx-auto text-violet-300">
              Please start the main Discord bot application to view live statistics.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
