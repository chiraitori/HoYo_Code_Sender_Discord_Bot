'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ServerConfig {
  guildId: string;
  genshinRole: string | null;
  hsrRole: string | null;
  zzzRole: string | null;
  channel: string | null;
}

interface ServerSettings {
  guildId: string;
  autoSendEnabled: boolean;
  favoriteGames: {
    enabled: boolean;
    games: {
      genshin: boolean;
      hkrpg: boolean;
      nap: boolean;
    };
  };
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
  roles?: {
    id: string;
    name: string;
    color: string;
    position: number;
    mentionable: boolean;
    managed: boolean;
  }[];
  channels?: {
    id: string;
    name: string;
    type: number;
    position: number;
  }[];
}

export default function ServerManagement() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  
  const [guild, setGuild] = useState<Guild | null>(null);
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        // Fetch guild info from bot API
        const guildResponse = await fetch(`/api/bot/guild/${serverId}`);
        if (guildResponse.ok) {
          const guildData = await guildResponse.json();
          setGuild(guildData);
        }

        // Fetch server configuration
        const configResponse = await fetch(`/api/server/${serverId}/config`);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setConfig(configData);
        }

        // Fetch server settings
        const settingsResponse = await fetch(`/api/server/${serverId}/settings`);
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSettings(settingsData);
        }

      } catch (err) {
        console.error('Error fetching server data:', err);
        setError('Failed to load server data');
      } finally {
        setLoading(false);
      }
    };

    if (serverId) {
      fetchServerData();
    }
  }, [serverId]);

  const getServerIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`;
  };

  const toggleAutoSend = async () => {
    if (!settings) return;
    
    try {
      const newAutoSendState = !settings.autoSendEnabled;
      const response = await fetch(`/api/server/${serverId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSendEnabled: newAutoSendState }),
      });

      if (response.ok) {
        setSettings({ ...settings, autoSendEnabled: newAutoSendState });
        setSaveMessage('Auto-send setting updated successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update auto-send setting:', error);
    }
  };

  const toggleFavoriteGames = async () => {
    if (!settings) return;
    
    try {
      const newFavoriteGamesState = !settings.favoriteGames.enabled;
      const response = await fetch(`/api/server/${serverId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          favoriteGames: { 
            ...settings.favoriteGames, 
            enabled: newFavoriteGamesState 
          } 
        }),
      });

      if (response.ok) {
        setSettings({ 
          ...settings, 
          favoriteGames: { ...settings.favoriteGames, enabled: newFavoriteGamesState }
        });
        setSaveMessage('Favorite games setting updated successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update favorite games setting:', error);
    }
  };

  const toggleGamePreference = async (game: 'genshin' | 'hkrpg' | 'nap') => {
    if (!settings) return;
    
    try {
      const newGameState = !settings.favoriteGames.games[game];
      const response = await fetch(`/api/server/${serverId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          favoriteGames: { 
            ...settings.favoriteGames,
            games: {
              ...settings.favoriteGames.games,
              [game]: newGameState
            }
          } 
        }),
      });

      if (response.ok) {
        setSettings({ 
          ...settings, 
          favoriteGames: { 
            ...settings.favoriteGames,
            games: {
              ...settings.favoriteGames.games,
              [game]: newGameState
            }
          }
        });
        setSaveMessage(`${game} preference updated successfully!`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error(`Failed to update ${game} preference:`, error);
    }
  };

  const testNotifications = async () => {
    try {
      const response = await fetch(`/api/server/${serverId}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        setSaveMessage('Test notification sent successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Failed to send test notification');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setSaveMessage('Failed to send test notification');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const resetConfiguration = async () => {
    if (!confirm('Are you sure you want to reset all configuration? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/server/${serverId}/reset`, {
        method: 'POST',
      });

      if (response.ok) {
        // Reload the page data
        window.location.reload();
      } else {
        setSaveMessage('Failed to reset configuration');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      setSaveMessage('Failed to reset configuration');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const updateRole = async (gameType: 'genshin' | 'hsr' | 'zzz', roleId: string) => {
    try {
      const roleField = gameType === 'genshin' ? 'genshinRole' : 
                       gameType === 'hsr' ? 'hsrRole' : 'zzzRole';
      
      const response = await fetch(`/api/server/${serverId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [roleField]: roleId }),
      });

      if (response.ok) {
        setConfig({ ...config!, [roleField]: roleId });
        setSaveMessage(`${gameType.toUpperCase()} role updated successfully!`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error(`Failed to update ${gameType} role:`, error);
    }
  };

  const getRoleName = (roleId: string | null | undefined) => {
    if (!roleId || !guild?.roles) return 'Not configured';
    const role = guild.roles.find(r => r.id === roleId);
    return role ? role.name : 'Role not found';
  };

  const getChannelName = (channelId: string | null | undefined) => {
    if (!channelId || !guild?.channels) return 'Not configured';
    const channel = guild.channels.find(c => c.id === channelId);
    return channel ? `#${channel.name}` : 'Channel not found';
  };

  const updateChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/server/${serverId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channelId }),
      });

      if (response.ok) {
        setConfig({ ...config!, channel: channelId });
        setSaveMessage('Notification channel updated successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update notification channel:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-300 mx-auto"></div>
          <p className="text-purple-100 mt-4 text-xl">Loading server configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-purple-300 mb-8">{error}</p>
          <button
            onClick={() => router.push('/servers')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Servers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-primary)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            {guild && (
              <img
                src={getServerIcon(guild)}
                alt={guild.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--color-purple-50)' }}>
                {guild?.name || 'Server Management'}
              </h1>
              <p style={{ color: 'var(--color-purple-100)' }}>Configure HoYo Code Sender settings</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/servers')}
            className="px-4 py-2 rounded-lg transition-colors backdrop-blur-sm border"
            style={{ 
              background: 'rgba(39, 37, 91, 0.5)',
              borderColor: 'rgba(111, 98, 157, 0.3)',
              color: 'var(--color-purple-100)'
            }}
          >
            ← Back to Servers
          </button>
        </div>

        {/* Success Message */}
        {saveMessage && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="backdrop-blur-sm rounded-lg p-4 border" style={{
              background: 'rgba(34, 197, 94, 0.2)',
              borderColor: 'rgba(34, 197, 94, 0.3)'
            }}>
              <p className="text-center font-medium" style={{ color: 'rgb(34, 197, 94)' }}>{saveMessage}</p>
            </div>
          </div>
        )}

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Basic Configuration */}
          <div className="backdrop-blur-sm rounded-2xl p-6 border" style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(111, 98, 157, 0.3)'
          }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-purple-50)' }}>
              ⚙️ Basic Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--color-purple-100)' }}>
                  Auto-Send Enabled
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings?.autoSendEnabled || false}
                    onChange={toggleAutoSend}
                    className="w-5 h-5 rounded border cursor-pointer"
                    style={{ 
                      borderColor: 'var(--color-purple-300)',
                      background: 'rgba(28, 22, 69, 0.5)'
                    }}
                  />
                  <span className={`text-sm ${settings?.autoSendEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {settings?.autoSendEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--color-purple-100)' }}>
                  Notification Channel
                </label>
                <select
                  value={config?.channel || ''}
                  onChange={(e) => updateChannel(e.target.value)}
                  className="w-full rounded-lg p-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(28, 22, 69, 0.5)',
                    borderColor: 'rgba(111, 98, 157, 0.3)',
                    color: 'var(--color-purple-50)'
                  }}
                >
                  <option value="">Select a channel...</option>
                  {guild?.channels?.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm mt-1" style={{ color: 'var(--color-purple-300)' }}>
                  Current: {getChannelName(config?.channel)}
                </p>
              </div>
            </div>
          </div>

          {/* Game Roles */}
          <div className="backdrop-blur-sm rounded-2xl p-6 border" style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(111, 98, 157, 0.3)'
          }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-purple-50)' }}>
              🎮 Game Role Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--color-purple-100)' }}>
                  Genshin Impact Role
                </label>
                <select
                  value={config?.genshinRole || ''}
                  onChange={(e) => updateRole('genshin', e.target.value)}
                  className="w-full rounded-lg p-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(28, 22, 69, 0.5)',
                    borderColor: 'rgba(111, 98, 157, 0.3)',
                    color: 'var(--color-purple-50)'
                  }}
                >
                  <option value="">Select a role...</option>
                  {guild?.roles?.map(role => (
                    <option key={role.id} value={role.id}>
                      @{role.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm mt-1" style={{ color: 'var(--color-purple-300)' }}>
                  Current: {getRoleName(config?.genshinRole)}
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--color-purple-100)' }}>
                  Honkai: Star Rail Role
                </label>
                <select
                  value={config?.hsrRole || ''}
                  onChange={(e) => updateRole('hsr', e.target.value)}
                  className="w-full rounded-lg p-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(28, 22, 69, 0.5)',
                    borderColor: 'rgba(111, 98, 157, 0.3)',
                    color: 'var(--color-purple-50)'
                  }}
                >
                  <option value="">Select a role...</option>
                  {guild?.roles?.map(role => (
                    <option key={role.id} value={role.id}>
                      @{role.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm mt-1" style={{ color: 'var(--color-purple-300)' }}>
                  Current: {getRoleName(config?.hsrRole)}
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--color-purple-100)' }}>
                  Zenless Zone Zero Role
                </label>
                <select
                  value={config?.zzzRole || ''}
                  onChange={(e) => updateRole('zzz', e.target.value)}
                  className="w-full rounded-lg p-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(28, 22, 69, 0.5)',
                    borderColor: 'rgba(111, 98, 157, 0.3)',
                    color: 'var(--color-purple-50)'
                  }}
                >
                  <option value="">Select a role...</option>
                  {guild?.roles?.map(role => (
                    <option key={role.id} value={role.id}>
                      @{role.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm mt-1" style={{ color: 'var(--color-purple-300)' }}>
                  Current: {getRoleName(config?.zzzRole)}
                </p>
              </div>
            </div>
          </div>

          {/* Favorite Games */}
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-100 mb-6 flex items-center gap-2">
              ⭐ Favorite Games
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 font-medium mb-2">
                  Favorite Games Filter
                </label>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={settings?.favoriteGames?.enabled || false}
                    onChange={toggleFavoriteGames}
                    className="w-5 h-5 rounded border border-purple-500 bg-purple-900/50 cursor-pointer"
                  />
                  <span className={`text-sm ${settings?.favoriteGames?.enabled ? 'text-green-400' : 'text-red-400'}`}>
                    {settings?.favoriteGames?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {settings?.favoriteGames?.enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.favoriteGames.games.genshin}
                        onChange={() => toggleGamePreference('genshin')}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-purple-300">Genshin Impact</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.favoriteGames.games.hkrpg}
                        onChange={() => toggleGamePreference('hkrpg')}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-purple-300">Honkai: Star Rail</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.favoriteGames.games.nap}
                        onChange={() => toggleGamePreference('nap')}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-purple-300">Zenless Zone Zero</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-100 mb-6 flex items-center gap-2">
              🛠️ Actions
            </h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => setIsConfiguring(!isConfiguring)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                🔧 {isConfiguring ? 'Close Configuration' : 'Configure Settings'}
              </button>
              
              <button 
                onClick={testNotifications}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                📧 Test Notifications
              </button>
              
              <button 
                onClick={() => router.push(`/dashboard/server/${serverId}/stats`)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                📊 View Statistics
              </button>
              
              <button 
                onClick={resetConfiguration}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                🗑️ Reset Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
