'use client';

import { useState, useEffect } from 'react';

interface SystemHealth {
  bot: {
    status: 'online' | 'offline' | 'connecting';
    uptime: number;
    ping: number;
    lastRestart: string;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    requests24h: number;
    errors24h: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    connections: number;
    queries24h: number;
  };
  codes: {
    lastCheck: string;
    totalActive: number;
    newToday: number;
    expiredToday: number;
  };
}

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // Simulate system health data
        setHealth({
          bot: {
            status: 'online',
            uptime: 345600, // 4 days
            ping: 45,
            lastRestart: new Date(Date.now() - 345600000).toISOString()
          },
          api: {
            status: 'healthy',
            responseTime: 120,
            requests24h: 15420,
            errors24h: 3
          },
          database: {
            status: 'connected',
            connections: 12,
            queries24h: 8950
          },
          codes: {
            lastCheck: new Date(Date.now() - 60000).toISOString(),
            totalActive: 27,
            newToday: 5,
            expiredToday: 2
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch system health:', error);
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 300000); // Update every 5 minutes to reduce API calls
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
      case 'connected':
        return 'bg-green-400';
      case 'degraded':
      case 'slow':
      case 'connecting':
        return 'bg-yellow-400';
      case 'offline':
      case 'down':
      case 'disconnected':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const ago = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(ago / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-200 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-purple-200 rounded"></div>
            <div className="h-4 bg-purple-200 rounded w-5/6"></div>
            <div className="h-4 bg-purple-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-2xl max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-900">System Health</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-purple-600">Live</span>
          </div>
        </div>

        {health && (
          <div className="space-y-4">
            {/* Bot Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(health.bot.status)} animate-pulse`}></div>
                <span className="text-sm font-medium text-purple-800">Discord Bot</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600">{health.bot.ping}ms</div>
                <div className="text-xs text-purple-500">{formatUptime(health.bot.uptime)}</div>
              </div>
            </div>

            {/* API Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(health.api.status)} animate-pulse`}></div>
                <span className="text-sm font-medium text-purple-800">API</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600">{health.api.responseTime}ms</div>
                <div className="text-xs text-purple-500">{health.api.requests24h.toLocaleString()} req/24h</div>
              </div>
            </div>

            {/* Database Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(health.database.status)} animate-pulse`}></div>
                <span className="text-sm font-medium text-purple-800">Database</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600">{health.database.connections} conn</div>
                <div className="text-xs text-purple-500">{health.database.queries24h.toLocaleString()} queries</div>
              </div>
            </div>

            {/* Code Status */}
            <div className="border-t border-purple-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">Active Codes</span>
                <span className="text-sm font-bold text-purple-900">{health.codes.totalActive}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600">Last check:</span>
                <span className="text-purple-500">{formatTimeAgo(health.codes.lastCheck)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-green-600">New today: {health.codes.newToday}</span>
                <span className="text-red-600">Expired: {health.codes.expiredToday}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-purple-200 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                  Refresh
                </button>
                <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                  Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
