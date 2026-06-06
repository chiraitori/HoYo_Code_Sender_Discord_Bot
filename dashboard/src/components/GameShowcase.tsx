'use client';

import { useState, useEffect } from 'react';
import GameIcon from './GameIcon';

type GameId = 'genshin' | 'hsr' | 'zzz';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

interface GameData {
  id: GameId;
  name: string;
  gradient: string;
  description: string;
  codes: GameCode[];
  redeemUrl: string;
  codesUrl: string;
}

interface CodesApiResponse {
  games: Array<{
    game: GameId;
    codes: GameCode[];
  }>;
}

const INITIAL_GAMES: GameData[] = [
  {
    id: 'genshin',
    name: 'Genshin Impact',
    gradient: 'from-violet-500/20 to-violet-800/20',
    description: 'Explore the magical world of Teyvat and collect Primogems with exclusive codes',
    codes: [],
    redeemUrl: 'https://genshin.hoyoverse.com/en/gift',
    codesUrl: '/codes?game=genshin-impact'
  },
  {
    id: 'hsr',
    name: 'Honkai: Star Rail',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    description: 'Journey across the galaxy and earn Stellar Jade with special redemption codes',
    codes: [],
    redeemUrl: 'https://hsr.hoyoverse.com/gift',
    codesUrl: '/codes?game=honkai-star-rail'
  },
  {
    id: 'zzz',
    name: 'Zenless Zone Zero',
    gradient: 'from-pink-500/20 to-red-500/20',
    description: 'Dive into New Eridu and earn Polychrome with exclusive redemption codes',
    codes: [],
    redeemUrl: 'https://zenless.hoyoverse.com/redemption',
    codesUrl: '/codes?game=zenless-zone-zero'
  }
];

function GameCard({ game, loading }: { game: GameData; loading: boolean }) {
  const activeCodes = game.codes.filter(code => !code.isExpired);
  const latestCode = activeCodes[0];

  return (
    <div className="group relative glass-panel rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden hover:border-violet-400/30">
      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-4 right-4 opacity-50 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
          <GameIcon gameId={game.id} size={120} />
        </div>
      </div>

      <div className="relative z-10">
        {/* Game header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
              <GameIcon gameId={game.id} size={64} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{game.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-violet-200 text-sm font-medium">
                  {activeCodes.length} active codes
                </span>
                <div className={`w-2 h-2 rounded-full ${activeCodes.length > 0 ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-400'} animate-pulse`}></div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-violet-100/80 mb-6 leading-relaxed font-medium">
          {game.description}
        </p>

        {/* Latest code preview */}
        {latestCode ? (
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 group-hover:bg-black/40 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-violet-300 mb-1 font-bold">Latest Code</div>
                <code className="text-xl font-mono font-black text-white tracking-wide">
                  {latestCode.code}
                </code>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(latestCode.code)}
                className="glass-button text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                COPY
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-6 text-center">
            <div className="text-violet-300/50 font-medium">
              {loading ? '🔄 Loading codes...' : '📭 No active codes available'}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3">
          <a
            href={game.redeemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white text-violet-900 py-3 px-4 rounded-xl font-black text-center hover:bg-violet-50 transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            REDEEM
          </a>
          <a
            href={game.codesUrl}
            className="glass-button flex-1 text-white py-3 px-4 rounded-xl font-bold text-center"
          >
            VIEW ALL
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GameShowcase() {
  const [games, setGames] = useState<GameData[]>(INITIAL_GAMES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let requestInFlight = false;

    const fetchGameCodes = async () => {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const response = await fetch('/api/codes', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Code API responded with status ${response.status}`);
        }

        const data = await response.json() as CodesApiResponse;
        const codesByGame = new Map(data.games.map(game => [game.game, game.codes]));

        setGames(previousGames => previousGames.map(game => ({
          ...game,
          codes: codesByGame.get(game.id) || game.codes
        })));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching game codes:', error);
        }
      } finally {
        requestInFlight = false;
        setLoading(false);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchGameCodes();
      }
    };

    void fetchGameCodes();
    const interval = window.setInterval(refreshWhenVisible, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  return (
    <div className="py-20 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-6">
            <span className="text-gradient">Supported Games</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-violet-200/80 font-medium">
            Get the latest redemption codes for all your favorite HoYoverse games,
            delivered instantly to your Discord server
          </p>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {games.map(game => (
            <GameCard key={game.id} game={game} loading={loading} />
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-20 text-center">
          <div className="glass-panel border-white/10 rounded-[2.5rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <h3 className="text-3xl md:text-4xl font-black mb-4 text-white">
              Ready to never miss a code again?
            </h3>
            <p className="mb-8 max-w-2xl mx-auto text-lg text-violet-200">
              Add HoYoverse Code Sender to your Discord server and let your members know about new codes automatically
            </p>
            <a
              href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
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
