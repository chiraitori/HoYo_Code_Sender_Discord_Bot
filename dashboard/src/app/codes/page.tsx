'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast, ToastContainer } from '@/components/Toast';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

function CodesContent() {
  const searchParams = useSearchParams();
  const gameParam = searchParams.get('game') || '';
  
  const [codes, setCodes] = useState<GameCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  // Map game names to API endpoints and display info
  const gameInfo = {
    'genshin-impact': {
      name: 'Genshin Impact',
      endpoint: '/api/codes/genshin',
      emoji: '⚔️',
      color: 'from-purple-400 to-blue-500',
      redeemUrl: 'https://genshin.hoyoverse.com/en/gift'
    },
    'honkai-star-rail': {
      name: 'Honkai: Star Rail',
      endpoint: '/api/codes/hsr',
      emoji: '🚂',
      color: 'from-blue-400 to-purple-500',
      redeemUrl: 'https://hsr.hoyoverse.com/gift'
    },
    'zenless-zone-zero': {
      name: 'Zenless Zone Zero',
      endpoint: '/api/codes/zzz',
      emoji: '🏙️',
      color: 'from-cyan-400 to-blue-500',
      redeemUrl: 'https://zenless.hoyoverse.com/redemption'
    }
  };

  const currentGame = gameInfo[gameParam as keyof typeof gameInfo];

  useEffect(() => {
    if (!currentGame) {
      setError('Game not found');
      setLoading(false);
      return;
    }

    const fetchCodes = async () => {
      try {
        const response = await fetch(currentGame.endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch codes');
        }
        const data = await response.json();
        setCodes(data.codes || []);
      } catch (err) {
        console.error('Error fetching codes:', err);
        setError('Failed to load codes');
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [currentGame]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      addToast(`Code "${code}" copied to clipboard! 📋`, 'success');
    } catch (err) {
      console.error('Failed to copy code:', err);
      addToast('Failed to copy code to clipboard', 'error');
    }
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Game Not Found</h1>
          <p className="text-purple-300 mb-8">The requested game could not be found.</p>
          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-purple-300 hover:text-purple-100 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <div className={`inline-flex items-center space-x-4 bg-gradient-to-r ${currentGame.color} p-1 rounded-2xl mb-6`}>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
              <span className="text-6xl">{currentGame.emoji}</span>
            </div>
            <div className="text-left pr-6">
              <h1 className="text-4xl font-bold text-white">{currentGame.name}</h1>
              <p className="text-white/80">All Available Codes</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-300 mx-auto mb-4"></div>
            <p className="text-purple-300">Loading codes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-purple-300">{error}</p>
          </div>
        )}

        {/* Codes Grid */}
        {!loading && !error && (
          <>
            <div className="mb-8 text-center">
              <p className="text-purple-300">
                Found <strong className="text-purple-100">{codes.length}</strong> codes 
                ({codes.filter(code => !code.isExpired).length} active, {codes.filter(code => code.isExpired).length} expired)
              </p>
              <a
                href={currentGame.redeemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors mt-4"
              >
                <span>🎁 Open Redemption Page</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {codes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {codes.map((codeItem, index) => (
                  <div
                    key={index}
                    className={`bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${
                      codeItem.isExpired 
                        ? 'border-red-500/30 opacity-60' 
                        : 'border-purple-500/30 hover:border-purple-400/60'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        codeItem.isExpired 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {codeItem.isExpired ? '❌ Expired' : '✅ Active'}
                      </span>
                      <span className="text-purple-400 text-xs">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Code */}
                    <div className="bg-purple-800/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <code className="text-purple-100 font-mono text-lg font-bold">
                          {codeItem.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(codeItem.code)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          disabled={codeItem.isExpired}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-purple-400 text-xs">
                      Added: {new Date(codeItem.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-bold text-purple-100 mb-4">No Codes Available</h2>
                <p className="text-purple-300">
                  No codes are currently available for {currentGame.name}.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CodesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-300"></div>
      </div>
    }>
      <CodesContent />
    </Suspense>
  );
}
