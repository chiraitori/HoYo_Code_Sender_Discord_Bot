'use client';

import { useState, useEffect } from 'react';

interface BotStats {
  status: 'online' | 'offline' | 'idle';
  uptime: string;
  guilds: number;
  users: number;
  lastRestart: string;
  version: string;
}

export default function BotStatus() {
  const [botStats, setBotStats] = useState<BotStats>({
    status: 'online',
    uptime: '2d 14h 32m',
    guilds: 1247,
    users: 89634,
    lastRestart: '2024-12-15T10:30:00Z',
    version: '1.5.0'
  });

  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'idle': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'idle': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const restartBot = async () => {
    setLoading(true);
    // Simulate restart
    setTimeout(() => {
      setBotStats(prev => ({
        ...prev,
        lastRestart: new Date().toISOString(),
        uptime: '0m'
      }));
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bot Status</h2>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(botStats.status)}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(botStats.status).replace('text-', 'bg-')}`}></span>
            {botStats.status.toUpperCase()}
          </span>
          <button
            onClick={restartBot}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Restarting...' : '🔄 Restart Bot'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">{botStats.guilds.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Servers</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">{botStats.users.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">{botStats.uptime}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">v{botStats.version}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Version</div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Last Restart:</span>
          <span>{new Date(botStats.lastRestart).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
