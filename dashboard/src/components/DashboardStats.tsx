'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  totalCodes: {
    active: number;
    expired: number;
    total: number;
  };
  serversWithBot: {
    configured: number;
    total: number;
  };
  codesDistributed: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  gamePopularity: {
    genshin: number;
    hsr: number;
    zzz: number;
  };
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardData>({
    totalCodes: { active: 23, expired: 147, total: 170 },
    serversWithBot: { configured: 892, total: 1247 },
    codesDistributed: { today: 2341, thisWeek: 18756, thisMonth: 89234 },
    gamePopularity: { genshin: 45, hsr: 32, zzz: 23 }
  });

  const [loading, setLoading] = useState(false);

  const refreshStats = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
            <span className="text-white text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Statistics</h2>
        <button
          onClick={refreshStats}
          disabled={loading}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '🔄' : '📊'} Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Codes"
          value={stats.totalCodes.active}
          subtitle={`${stats.totalCodes.total} total codes`}
          icon="🎮"
          color="green"
        />
        
        <StatCard
          title="Configured Servers"
          value={`${stats.serversWithBot.configured}/${stats.serversWithBot.total}`}
          subtitle={`${Math.round((stats.serversWithBot.configured / stats.serversWithBot.total) * 100)}% configured`}
          icon="🖥️"
          color="blue"
        />
        
        <StatCard
          title="Codes Sent Today"
          value={stats.codesDistributed.today.toLocaleString()}
          subtitle={`${stats.codesDistributed.thisWeek.toLocaleString()} this week`}
          icon="📤"
          color="orange"
        />
        
        <StatCard
          title="Monthly Distribution"
          value={stats.codesDistributed.thisMonth.toLocaleString()}
          subtitle="codes sent this month"
          icon="📈"
          color="purple"
        />
      </div>

      {/* Game Popularity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Game Popularity</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">⚔️ Genshin Impact</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{stats.gamePopularity.genshin}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.gamePopularity.genshin}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🚂 Honkai: Star Rail</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{stats.gamePopularity.hsr}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.gamePopularity.hsr}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🏙️ Zenless Zone Zero</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{stats.gamePopularity.zzz}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.gamePopularity.zzz}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
