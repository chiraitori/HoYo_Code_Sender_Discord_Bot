'use client';

import { useState, useEffect } from 'react';

interface StatsData {
  totalServers: number;
  totalUsers: number;
  activeCodes: number;
  codesDistributed: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<StatsData>({
    totalServers: 0,
    totalUsers: 0,
    activeCodes: 0,
    codesDistributed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Animate numbers counting up
    const targetStats = {
      totalServers: 1247,
      totalUsers: 89634,
      activeCodes: 23,
      codesDistributed: 156789
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        totalServers: Math.floor(targetStats.totalServers * progress),
        totalUsers: Math.floor(targetStats.totalUsers * progress),
        activeCodes: Math.floor(targetStats.activeCodes * progress),
        codesDistributed: Math.floor(targetStats.codesDistributed * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
        setLoading(false);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  const StatCard = ({ icon, label, value, suffix = '' }: {
    icon: string;
    label: string;
    value: number;
    suffix?: string;
  }) => (
    <div className="group bg-gradient-to-br from-purple-800/50 to-purple-700/30 backdrop-blur-sm border border-purple-300/20 rounded-2xl p-8 hover:from-purple-700/60 hover:to-purple-600/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-300/20">
      <div className="text-center">
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="text-4xl font-black text-purple-50 mb-2">
          {value.toLocaleString()}{suffix}
        </div>
        <div className="text-purple-100/80 font-medium text-lg">
          {label}
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-purple-50 to-purple-100 bg-clip-text text-transparent mb-6">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-purple-100/80 max-w-2xl mx-auto">
            Join the growing community of Discord servers that never miss a HoYoverse redemption code
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard
            icon="🖥️"
            label="Discord Servers"
            value={stats.totalServers}
          />
          <StatCard
            icon="👥"
            label="Active Users"
            value={stats.totalUsers}
          />
          <StatCard
            icon="🎮"
            label="Live Codes"
            value={stats.activeCodes}
          />
          <StatCard
            icon="📤"
            label="Codes Distributed"
            value={stats.codesDistributed}
            suffix="+"
          />
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-purple-100/60">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🔒</span>
              <span>Secure & Safe</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⚡</span>
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">🆓</span>
              <span>100% Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
