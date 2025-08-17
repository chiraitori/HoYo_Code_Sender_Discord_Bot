'use client';

import { useState } from 'react';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

interface Game {
  id: string;
  name: string;
  emoji: string;
  color: string;
  redeemUrl: string;
}

interface GameCodeCardProps {
  game: Game;
  codes: GameCode[];
  loading: boolean;
}

export default function GameCodeCard({ game, codes, loading }: GameCodeCardProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const activeCodes = codes.filter(code => !code.isExpired);
  const expiredCodes = codes.filter(code => code.isExpired);

  const getGameColorClasses = (color: string) => {
    switch (color) {
      case 'genshin':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-600',
          border: 'border-blue-200',
          hover: 'hover:bg-blue-50'
        };
      case 'hsr':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          hover: 'hover:bg-yellow-50'
        };
      case 'zzz':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-600',
          border: 'border-orange-200',
          hover: 'hover:bg-orange-50'
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50'
        };
    }
  };

  const colorClasses = getGameColorClasses(game.color);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Card Header */}
      <div className={`${colorClasses.bg} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{game.emoji}</span>
            <div>
              <h2 className="text-lg font-bold">{game.name}</h2>
              <div className="text-white/80 text-sm">
                {activeCodes.length} active • {expiredCodes.length} expired
              </div>
            </div>
          </div>
          <a
            href={game.redeemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Redeem →
          </a>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <>
            {/* Active Codes */}
            {activeCodes.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center space-x-2">
                  <span>✅</span>
                  <span>Active Codes ({activeCodes.length})</span>
                </h3>
                {activeCodes.map((codeData, index) => (
                  <div
                    key={index}
                    className={`border ${colorClasses.border} rounded-lg p-3 ${colorClasses.hover} dark:hover:bg-gray-700 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                          {codeData.code}
                        </code>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Added: {new Date(codeData.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(codeData.code)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          copiedCode === codeData.code
                            ? 'bg-green-500 text-white'
                            : `${colorClasses.text} hover:bg-gray-100 dark:hover:bg-gray-600`
                        }`}
                      >
                        {copiedCode === codeData.code ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-400 text-4xl mb-2">📭</div>
                <p className="text-gray-600 dark:text-gray-400">No active codes available</p>
              </div>
            )}

            {/* Expired Codes */}
            {expiredCodes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center space-x-2">
                    <span className="transform group-open:rotate-90 transition-transform">▶</span>
                    <span>Show Expired Codes ({expiredCodes.length})</span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {expiredCodes.map((codeData, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-sm text-gray-600 dark:text-gray-400 line-through">
                            {codeData.code}
                          </code>
                          <span className="text-xs text-red-500">Expired</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
