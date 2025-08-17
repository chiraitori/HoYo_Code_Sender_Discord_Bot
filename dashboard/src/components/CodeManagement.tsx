'use client';

import { useState, useEffect } from 'react';

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
  game: string;
}

export default function CodeManagement() {
  const [codes, setCodes] = useState<GameCode[]>([]);
  const [selectedGame, setSelectedGame] = useState<'all' | 'genshin' | 'hsr' | 'zzz'>('all');
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [addingCode, setAddingCode] = useState(false);

  // Mock data for demonstration
  const mockCodes: GameCode[] = [
    { code: 'GENSHINGIFT', isExpired: false, timestamp: '2024-12-15T10:00:00Z', game: 'genshin' },
    { code: 'STARRAIL50', isExpired: false, timestamp: '2024-12-15T09:30:00Z', game: 'hsr' },
    { code: 'ZENLESS100', isExpired: false, timestamp: '2024-12-15T08:45:00Z', game: 'zzz' },
    { code: 'OLDCODE123', isExpired: true, timestamp: '2024-12-10T15:20:00Z', game: 'genshin' },
  ];

  useEffect(() => {
    setCodes(mockCodes);
  }, []);

  const filteredCodes = codes.filter(code => 
    selectedGame === 'all' || code.game === selectedGame
  );

  const activeCodes = filteredCodes.filter(code => !code.isExpired);
  const expiredCodes = filteredCodes.filter(code => code.isExpired);

  const getGameInfo = (game: string) => {
    switch (game) {
      case 'genshin':
        return { name: 'Genshin Impact', emoji: '⚔️', color: 'blue' };
      case 'hsr':
        return { name: 'Honkai: Star Rail', emoji: '🚂', color: 'yellow' };
      case 'zzz':
        return { name: 'Zenless Zone Zero', emoji: '🏙️', color: 'orange' };
      default:
        return { name: 'Unknown', emoji: '🎮', color: 'gray' };
    }
  };

  const addCode = async () => {
    if (!newCode.trim()) return;
    
    setAddingCode(true);
    // Simulate API call
    setTimeout(() => {
      const newCodeObj: GameCode = {
        code: newCode,
        isExpired: false,
        timestamp: new Date().toISOString(),
        game: selectedGame === 'all' ? 'genshin' : selectedGame
      };
      setCodes(prev => [newCodeObj, ...prev]);
      setNewCode('');
      setAddingCode(false);
    }, 1000);
  };

  const toggleCodeExpiry = async (codeToToggle: string) => {
    setCodes(prev => prev.map(code => 
      code.code === codeToToggle 
        ? { ...code, isExpired: !code.isExpired }
        : code
    ));
  };

  const deleteCode = async (codeToDelete: string) => {
    setCodes(prev => prev.filter(code => code.code !== codeToDelete));
  };

  const distributeCode = async (code: string) => {
    // Simulate distributing code to all servers
    alert(`Distributing code "${code}" to all configured servers...`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Code Management</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeCodes.length} active • {expiredCodes.length} expired
          </span>
        </div>
      </div>

      {/* Add New Code */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Code</h3>
        <div className="flex gap-3">
          <select
            value={selectedGame === 'all' ? 'genshin' : selectedGame}
            onChange={(e) => setSelectedGame(e.target.value as typeof selectedGame)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="genshin">⚔️ Genshin Impact</option>
            <option value="hsr">🚂 Honkai: Star Rail</option>
            <option value="zzz">🏙️ Zenless Zone Zero</option>
          </select>
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., GENSHINGIFT)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={addCode}
            disabled={!newCode.trim() || addingCode}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingCode ? '⏳' : '➕'} Add
          </button>
        </div>
      </div>

      {/* Game Filter */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'genshin', 'hsr', 'zzz'] as const).map((game) => (
          <button
            key={game}
            onClick={() => setSelectedGame(game)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGame === game
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {game === 'all' ? '🎮 All Games' : `${getGameInfo(game).emoji} ${getGameInfo(game).name}`}
          </button>
        ))}
      </div>

      {/* Active Codes */}
      {activeCodes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center">
            <span className="mr-2">✅</span>
            Active Codes ({activeCodes.length})
          </h3>
          <div className="space-y-3">
            {activeCodes.map((codeData, index) => {
              const gameInfo = getGameInfo(codeData.game);
              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{gameInfo.emoji}</span>
                      <div>
                        <code className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                          {codeData.code}
                        </code>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {gameInfo.name} • Added {new Date(codeData.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => distributeCode(codeData.code)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        📤 Send Now
                      </button>
                      <button
                        onClick={() => toggleCodeExpiry(codeData.code)}
                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                      >
                        ⏰ Mark Expired
                      </button>
                      <button
                        onClick={() => deleteCode(codeData.code)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired Codes */}
      {expiredCodes.length > 0 && (
        <div>
          <details className="group">
            <summary className="cursor-pointer font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
              <span className="mr-2 transform group-open:rotate-90 transition-transform">▶</span>
              <span className="mr-2">❌</span>
              Expired Codes ({expiredCodes.length})
            </summary>
            <div className="space-y-2 ml-6">
              {expiredCodes.map((codeData, index) => {
                const gameInfo = getGameInfo(codeData.game);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{gameInfo.emoji}</span>
                        <div>
                          <code className="font-mono text-sm text-gray-600 dark:text-gray-400 line-through">
                            {codeData.code}
                          </code>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {gameInfo.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleCodeExpiry(codeData.code)}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          ↩️ Restore
                        </button>
                        <button
                          onClick={() => deleteCode(codeData.code)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}

      {filteredCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          No codes found for the selected filter.
        </div>
      )}
    </div>
  );
}
