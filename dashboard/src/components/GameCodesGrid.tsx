'use client';

import { useState, useEffect } from 'react';
import GameCodeCard from './GameCodeCard';
import LoadingSpinner from './LoadingSpinner';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

interface GameCodes {
  genshin: GameCode[];
  hsr: GameCode[];
  zzz: GameCode[];
}

const games = [
  {
    id: 'genshin' as const,
    name: 'Genshin Impact',
    emoji: '⚔️',
    color: 'genshin',
    redeemUrl: 'https://genshin.hoyoverse.com/en/gift'
  },
  {
    id: 'hsr' as const,
    name: 'Honkai: Star Rail',
    emoji: '🚂',
    color: 'hsr',
    redeemUrl: 'https://hsr.hoyoverse.com/gift'
  },
  {
    id: 'zzz' as const,
    name: 'Zenless Zone Zero',
    emoji: '🏙️',
    color: 'zzz',
    redeemUrl: 'https://zenless.hoyoverse.com/redemption'
  }
];

export default function GameCodesGrid() {
  const [codes, setCodes] = useState<GameCodes>({
    genshin: [],
    hsr: [],
    zzz: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch codes for each game
      const promises = games.map(async (game) => {
        const response = await fetch(`/api/codes/${game.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${game.name} codes`);
        }
        const data = await response.json();
        return { gameId: game.id, codes: data.codes || [] };
      });

      const results = await Promise.all(promises);
      
      const newCodes = {
        genshin: [],
        hsr: [],
        zzz: []
      } as GameCodes;

      results.forEach(({ gameId, codes: gameCodes }) => {
        newCodes[gameId] = gameCodes;
      });

      setCodes(newCodes);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch codes');
      console.error('Error fetching codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchCodes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !lastUpdated) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !lastUpdated) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ Error loading codes</div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchCodes}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          {loading && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
          {lastUpdated && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <button
          onClick={fetchCodes}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && lastUpdated && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
            <span>⚠️</span>
            <span className="text-sm">Failed to refresh: {error}</span>
          </div>
        </div>
      )}

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCodeCard
            key={game.id}
            game={game}
            codes={codes[game.id]}
            loading={loading}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Codes are automatically refreshed every 5 minutes.</p>
        <p className="mt-1">
          Data sourced from{' '}
          <a 
            href="https://hoyo-codes.seria.moe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            HoYo Codes API
          </a>
        </p>
      </div>
    </div>
  );
}
