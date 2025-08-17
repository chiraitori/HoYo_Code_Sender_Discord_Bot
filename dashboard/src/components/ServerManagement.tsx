'use client';

import { useState } from 'react';

interface Server {
  id: string;
  name: string;
  memberCount: number;
  isConfigured: boolean;
  autoSendEnabled: boolean;
  channelName?: string;
  lastActivity: string;
  favoriteGames: string[];
}

export default function ServerManagement() {
  const [servers] = useState<Server[]>([
    {
      id: '1',
      name: 'Genshin Impact Central',
      memberCount: 45672,
      isConfigured: true,
      autoSendEnabled: true,
      channelName: '#genshin-codes',
      lastActivity: '2024-12-15T14:30:00Z',
      favoriteGames: ['genshin', 'hsr']
    },
    {
      id: '2',
      name: 'HoYoverse Community',
      memberCount: 23841,
      isConfigured: true,
      autoSendEnabled: false,
      channelName: '#codes',
      lastActivity: '2024-12-15T10:15:00Z',
      favoriteGames: ['genshin', 'hsr', 'zzz']
    },
    {
      id: '3',
      name: 'Star Rail Station',
      memberCount: 18934,
      isConfigured: false,
      autoSendEnabled: false,
      lastActivity: '2024-12-14T20:45:00Z',
      favoriteGames: ['hsr']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'configured' | 'unconfigured'>('all');

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'configured' && server.isConfigured) ||
      (filter === 'unconfigured' && !server.isConfigured);
    return matchesSearch && matchesFilter;
  });

  const getGameEmoji = (game: string) => {
    switch (game) {
      case 'genshin': return '⚔️';
      case 'hsr': return '🚂';
      case 'zzz': return '🏙️';
      default: return '🎮';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Server Management</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredServers.length} servers
        </span>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Servers</option>
          <option value="configured">Configured</option>
          <option value="unconfigured">Unconfigured</option>
        </select>
      </div>

      {/* Server List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredServers.map((server) => (
          <div
            key={server.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{server.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    👥 {server.memberCount.toLocaleString()} members
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    server.isConfigured 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {server.isConfigured ? '✅ Configured' : '❌ Not Configured'}
                  </span>
                  
                  {server.isConfigured && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      server.autoSendEnabled 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {server.autoSendEnabled ? '🔄 Auto-send ON' : '⏸️ Auto-send OFF'}
                    </span>
                  )}
                </div>

                {server.channelName && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    📢 Channel: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{server.channelName}</code>
                  </div>
                )}

                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Games:</span>
                  {server.favoriteGames.map((game) => (
                    <span key={game} className="text-sm">
                      {getGameEmoji(game)}
                    </span>
                  ))}
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Last activity: {new Date(server.lastActivity).toLocaleString()}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-blue-600 transition-colors">
                  Manage
                </button>
                {server.isConfigured && (
                  <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
                    Send Test
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No servers found matching your criteria.
        </div>
      )}
    </div>
  );
}
