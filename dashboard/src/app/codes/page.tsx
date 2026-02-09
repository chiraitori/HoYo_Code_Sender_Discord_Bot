'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast, ToastContainer } from '@/components/Toast';
import Aurora from '@/components/Aurora';
import { HOYO_GAME_ICONS } from '@/utils/discordGameIcons';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
  game?: string; // Added to track source game in combined view
}

// Fallback Generic Icon
const GenericIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6C9.996 6 10.5 6.504 10.5 7.125v7.5c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-7.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 17.5c0 .414.336.75.75.75h9.75a.75.75 0 00.75-.75V7.125a.75.75 0 00-.75-.75H3a.75.75 0 00-.75.75V17.5z" opacity="0.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.125c0-.621-.504-1.125-1.125-1.125h-6c-.621 0-1.125.504-1.125 1.125v7.5c0 .621.504 1.125 1.125 1.125h6c.621 0 1.125-.504 1.125-1.125v-7.5z" />
  </svg>
);

function CodesContent() {
  const searchParams = useSearchParams();
  const gameParam = searchParams.get('game');
  const router = useRouter();

  const [codes, setCodes] = useState<GameCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const gameInfo = {
    'genshin-impact': {
      name: 'Genshin Impact',
      endpoint: '/api/codes/genshin',
      iconUrl: HOYO_GAME_ICONS.genshin,
      color: 'text-violet-300',
      heroColor: 'from-violet-600 to-purple-600',
      redeemUrl: 'https://genshin.hoyoverse.com/en/gift'
    },
    'honkai-star-rail': {
      name: 'Honkai: Star Rail',
      endpoint: '/api/codes/hsr',
      iconUrl: HOYO_GAME_ICONS.hsr,
      color: 'text-accent-cyan',
      heroColor: 'from-blue-600 to-cyan-500',
      redeemUrl: 'https://hsr.hoyoverse.com/gift'
    },
    'zenless-zone-zero': {
      name: 'Zenless Zone Zero',
      endpoint: '/api/codes/zzz',
      iconUrl: HOYO_GAME_ICONS.zzz,
      color: 'text-accent-pink',
      heroColor: 'from-pink-600 to-rose-500',
      redeemUrl: 'https://zenless.hoyoverse.com/redemption'
    }
  };

  // Determine current view mode
  const isAllGames = !gameParam;
  const currentGame = gameParam ? gameInfo[gameParam as keyof typeof gameInfo] : null;

  useEffect(() => {
    // If specific game is requested but not found
    if (gameParam && !currentGame) {
      setError('Game not found');
      setLoading(false);
      return;
    }

    const fetchCodes = async () => {
      setLoading(true);
      setError(null);
      try {
        let allCodes: GameCode[] = [];

        if (isAllGames) {
          // Fetch all games in parallel
          const promises = Object.entries(gameInfo).map(async ([key, info]) => {
            try {
              const res = await fetch(info.endpoint);
              if (!res.ok) return [];
              const data = await res.json();
              return (data.codes || []).map((c: any) => ({ ...c, game: key }));
            } catch (e) {
              console.error(`Error fetching ${key}:`, e);
              return [];
            }
          });

          const results = await Promise.all(promises);
          allCodes = results.flat().sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        } else if (currentGame) {
          // Fetch single game
          const response = await fetch(currentGame.endpoint);
          if (!response.ok) throw new Error('Failed to fetch codes');
          const data = await response.json();
          allCodes = (data.codes || []).map((c: any) => ({ ...c, game: gameParam }));
        }

        setCodes(allCodes);
      } catch (err) {
        console.error('Error fetching codes:', err);
        setError('Failed to load codes');
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [gameParam]); // Re-run when param changes

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      addToast(`Code "${code}" copied to clipboard! 📋`, 'success');
    } catch (err) {
      console.error('Failed to copy code:', err);
      addToast('Failed to copy code to clipboard', 'error');
    }
  };

  const LoadingScreen = () => (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <Aurora colorStops={["#4b1ec8", "#00f0ff", "#ff3c96"]} speed={0.5} />
      <div className="relative z-10 text-center">
        <div className="glass-panel p-8 rounded-full mb-8 inline-block shadow-[0_0_50px_rgba(124,58,237,0.3)]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-accent-cyan relative">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-accent-pink animate-spin-reverse opacity-70"></div>
          </div>
        </div>
        <p className="text-white text-xl font-bold animate-pulse">Fetching latest codes...</p>
      </div>
    </div>
  );

  if (loading) return <LoadingScreen />;

  // Error state only if specific game requested is invalid
  if (gameParam && !currentGame) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <Aurora colorStops={["#2e1065", "#4c1d95", "#0f172a"]} blend={0.6} />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
          <div className="glass-panel p-10 rounded-3xl border-red-500/30 relative overflow-hidden group">
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Game Not Found</h1>
            <button
              onClick={() => router.push('/')}
              className="glass-button w-full py-4 rounded-xl text-white font-bold bg-violet-600/20 hover:bg-violet-600/40 mt-8"
            >
              Return directly to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display Variables
  const displayTitle = currentGame ? currentGame.name : "All Game Codes";
  const themeColor = currentGame ? currentGame.color : "text-white";
  const heroGradient = currentGame ? currentGame.heroColor : "from-violet-600 via-fuchsia-500 to-cyan-500";

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Aurora colorStops={["#2e1065", "#4c1d95", "#0f172a"]} blend={0.6} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-violet-300 hover:text-white mb-8 transition-colors group font-medium"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            Back to Home
          </Link>

          <div className="glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden">
            <div className={`absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br ${heroGradient} rounded-full blur-[100px] opacity-30`}></div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl w-24 h-24 flex items-center justify-center overflow-hidden">
                {currentGame ? (
                  <img src={currentGame.iconUrl} alt={currentGame.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 ${themeColor}`}>
                    <GenericIcon />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                  {displayTitle}
                </h1>
                <p className="text-violet-200/80 text-lg flex items-center justify-center md:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Latest Redemption Codes
                </p>
              </div>

              {currentGame && (
                <div className="md:ml-auto">
                  <a
                    href={currentGame.redeemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 group hover:bg-white/10"
                  >
                    <span className="text-xl">🎁</span>
                    <span className="font-bold text-white">Redeem Page</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters/Stats */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border-white/5 bg-black/20">
          <div className="flex items-center gap-4">
            {['genshin-impact', 'honkai-star-rail', 'zenless-zone-zero'].map(g => (
              <Link
                key={g}
                href={`/codes?game=${g}`}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${gameParam === g
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-white/5 hover:bg-white/10 text-violet-200'
                  }`}
              >
                {gameInfo[g as keyof typeof gameInfo].name}
              </Link>
            ))}

            <Link
              href="/codes"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${!gameParam
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-white/5 hover:bg-white/10 text-violet-200'
                }`}
            >
              View All Games
            </Link>
          </div>
          <div className="text-violet-300 text-sm font-medium">
            Total Codes: <span className="text-white">{codes.length}</span>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <div className="glass-panel p-8 rounded-full mb-8 inline-block shadow-[0_0_50px_rgba(124,58,237,0.3)] animate-pulse">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan relative">
                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-accent-pink animate-spin-reverse opacity-70"></div>
              </div>
            </div>
            <p className="text-white text-lg font-bold animate-pulse">Updating codes...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-12 rounded-3xl text-center border-white/5 bg-black/20">
            <div className="text-7xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Failed to Load</h2>
            <p className="text-violet-200/60 max-w-md mx-auto">{error}</p>
          </div>
        ) : codes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {codes.map((codeItem, index) => {
              const itemGameInfo = codeItem.game ? gameInfo[codeItem.game as keyof typeof gameInfo] : currentGame;
              const borderClass = codeItem.isExpired
                ? 'border-red-500/10'
                : itemGameInfo?.color === 'text-accent-pink' ? 'hover:border-accent-pink/50'
                  : itemGameInfo?.color === 'text-accent-cyan' ? 'hover:border-accent-cyan/50'
                    : 'hover:border-violet-400/50';

              return (
                <div
                  key={`${codeItem.code}-${index}`}
                  className={`glass-panel rounded-2xl p-6 group transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden border-white/5 ${borderClass} ${codeItem.isExpired ? 'opacity-60' : ''}`}
                >
                  {/* Active Glow */}
                  {!codeItem.isExpired && (
                    <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${itemGameInfo?.heroColor || 'from-white to-white'} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>
                  )}

                  {/* Header */}
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex items-center gap-2">
                      {/* Game Icon Mini & Name */}
                      {codeItem.game && itemGameInfo && (
                        <div className="flex items-center gap-2 mr-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden shadow-sm flex-shrink-0" title={itemGameInfo.name}>
                            <img src={itemGameInfo.iconUrl} alt={itemGameInfo.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`text-[10px] font-bold hidden sm:block ${itemGameInfo.color} opacity-90`}>
                            {itemGameInfo.name}
                          </span>
                        </div>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${codeItem.isExpired
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                        {codeItem.isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Code */}
                  <div className="relative z-10">
                    <div className={`bg-black/30 rounded-xl p-4 mb-4 border border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors ${!codeItem.isExpired ? 'cursor-pointer' : ''}`}
                      onClick={() => !codeItem.isExpired && copyToClipboard(codeItem.code)}
                    >
                      <code className={`font-mono text-xl font-bold tracking-wide ${codeItem.isExpired ? 'text-white/40 line-through decoration-red-500/50' : 'text-white'}`}>
                        {codeItem.code}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(codeItem.code);
                        }}
                        className={`p-2 rounded-lg transition-all active:scale-95 ${codeItem.isExpired
                          ? 'text-white/20 cursor-not-allowed'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg'
                          }`}
                        disabled={codeItem.isExpired}
                        title="Copy Code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs font-medium relative z-10">
                    <span className="text-violet-300/40">{new Date(codeItem.timestamp).toLocaleDateString()}</span>
                    {itemGameInfo && (
                      <span className={`${itemGameInfo.color} opacity-60`}>{itemGameInfo.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-3xl text-center border-white/5 bg-black/20">
            <div className="text-7xl mb-6 opacity-50 grayscale">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Codes Available</h2>
            <p className="text-violet-200/60 max-w-md mx-auto">
              Check back later or join our Discord for instant notifications!
            </p>
          </div>
        )
        }

      </div>
    </div>
  );
}

export default function CodesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <CodesContent />
    </Suspense>
  );
}
