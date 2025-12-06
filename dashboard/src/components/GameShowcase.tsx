'use client';

import { useState, useEffect } from 'react';
import GameIcon from './GameIcon';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

interface GameData {
  name: string;
  emoji: string;
  gradient: string;
  description: string;
  codes: GameCode[];
  redeemUrl: string;
}

export default function GameShowcase() {
  // Helper function to get game ID from name
  const getGameId = (gameName: string): 'genshin' | 'hsr' | 'zzz' => {
    switch (gameName) {
      case 'Genshin Impact': return 'genshin';
      case 'Honkai: Star Rail': return 'hsr';
      case 'Zenless Zone Zero': return 'zzz';
      default: return 'genshin';
    }
  };

  const [games, setGames] = useState<GameData[]>([
    {
      name: 'Genshin Impact',
      emoji: '⚔️',
      gradient: 'from-purple-300 to-purple-100',
      description: 'Explore the magical world of Teyvat and collect Primogems with exclusive codes',
      codes: [],
      redeemUrl: 'https://genshin.hoyoverse.com/en/gift'
    },
    {
      name: 'Honkai: Star Rail',
      emoji: '🚂',
      gradient: 'from-purple-100 to-purple-300',
      description: 'Journey across the galaxy and earn Stellar Jade with special redemption codes',
      codes: [],
      redeemUrl: 'https://hsr.hoyoverse.com/gift'
    },
    {
      name: 'Zenless Zone Zero',
      emoji: '🏙️',
      gradient: 'from-purple-300 to-purple-500',
      description: 'Dive into New Eridu and earn Polychrome with exclusive redemption codes',
      codes: [],
      redeemUrl: 'https://zenless.hoyoverse.com/redemption'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchGameCodes = async () => {
      try {
        // Fetch from dashboard's own API routes
        const gameEndpoints = [
          { id: 'genshin', url: '/api/codes/genshin' },
          { id: 'hsr', url: '/api/codes/hsr' },
          { id: 'zzz', url: '/api/codes/zzz' }
        ];

        const promises = gameEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url);
            if (response.ok) {
              const data = await response.json();
              return { id: endpoint.id, codes: data.codes || [] };
            }
          } catch (error) {
            console.error(`Failed to fetch ${endpoint.id} codes:`, error);
          }
          return { id: endpoint.id, codes: [] };
        });

        const results = await Promise.all(promises);

        setGames(prevGames =>
          prevGames.map(game => {
            const result = results.find(r =>
              (r.id === 'genshin' && game.name === 'Genshin Impact') ||
              (r.id === 'hsr' && game.name === 'Honkai: Star Rail') ||
              (r.id === 'zzz' && game.name === 'Zenless Zone Zero')
            );
            return result ? { ...game, codes: result.codes } : game;
          })
        );
      } catch (error) {
        console.error('Error fetching game codes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameCodes();
    // Refresh every 5 minutes
    const interval = setInterval(fetchGameCodes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const GameCard = ({ game }: { game: GameData }) => {
    const activeCodes = game.codes.filter(code => !code.isExpired);
    const latestCode = activeCodes[0];

    return (
      <div className="group relative bg-gradient-to-br from-purple-800/40 to-purple-700/20 backdrop-blur-sm border border-purple-300/20 rounded-3xl p-8 hover:from-purple-700/50 hover:to-purple-600/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-300/20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 opacity-50">
            <GameIcon gameId={getGameId(game.name)} size={96} />
          </div>
        </div>

        <div className="relative z-10">
          {/* Game header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <GameIcon gameId={getGameId(game.name)} size={64} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-purple-50">{game.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-purple-100/80 text-sm">
                    {activeCodes.length} active codes
                  </span>
                  <div className={`w-2 h-2 rounded-full ${activeCodes.length > 0 ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-purple-100/70 mb-6 leading-relaxed">
            {game.description}
          </p>

          {/* Latest code preview */}
          {latestCode ? (
            <div className="bg-purple-900/50 border border-purple-300/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-100/60 mb-1">Latest Code</div>
                  <code className="text-lg font-mono font-bold text-purple-100 bg-purple-800/50 px-3 py-1 rounded-lg">
                    {latestCode.code}
                  </code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(latestCode.code)}
                  className="bg-gradient-to-r from-purple-300 to-purple-100 text-purple-900 px-3 py-2 rounded-lg font-medium hover:from-purple-100 hover:to-purple-300 transition-all duration-300"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-purple-900/30 border border-purple-300/20 rounded-xl p-4 mb-6 text-center">
              <div className="text-purple-100/50">
                {!isMounted || loading ? '🔄 Loading codes...' : '📭 No active codes available'}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            <a
              href={game.redeemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-purple-300 to-purple-100 text-purple-900 py-3 px-4 rounded-xl font-bold text-center hover:from-purple-100 hover:to-purple-300 transition-all duration-300 hover:scale-105"
            >
              🎁 Redeem Codes
            </a>
            <a
              href={`/codes?game=${game.name === 'Genshin Impact' ? 'genshin-impact' :
                  game.name === 'Honkai: Star Rail' ? 'honkai-star-rail' :
                    game.name === 'Zenless Zone Zero' ? 'zenless-zone-zero' :
                      game.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
                }`}
              className="border-2 border-purple-300/50 text-purple-100 py-3 px-4 rounded-xl font-bold text-center hover:bg-purple-100/10 hover:border-purple-300 transition-all duration-300"
            >
              📋 View All
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-20 px-4" style={{ background: 'transparent' }}>
      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-6" style={{
            backgroundImage: `linear-gradient(to right, rgb(213, 203, 225), rgb(154, 145, 193))`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            Supported Games
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
            Get the latest redemption codes for all your favorite HoYoverse games,
            delivered instantly to your Discord server
          </p>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <GameCard key={index} game={game} />
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-16 text-center">
          <div className="backdrop-blur-sm border rounded-3xl p-8" style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(111, 98, 157, 0.3)'
          }}>
            <h3 className="text-3xl font-bold mb-4" style={{ color: 'rgb(213, 203, 225)' }}>
              Ready to never miss a code again?
            </h3>
            <p className="mb-6 max-w-2xl mx-auto" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
              Add HoYo Code Sender to your Discord server and let your members know about new codes automatically
            </p>
            <a
              href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
              style={{
                background: `linear-gradient(to right, rgb(111, 98, 157), rgb(154, 145, 193))`,
                color: 'rgb(213, 203, 225)'
              }}
            >
              <span>🚀 Add to Discord</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
