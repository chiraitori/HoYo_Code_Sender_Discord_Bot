'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  botPresent?: boolean;
  canInvite?: boolean;
}

interface ServerPickerProps {
  onServerSelect?: (serverId: string) => void;
}

export default function ServerPicker({ onServerSelect }: ServerPickerProps) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteServers, setShowInviteServers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        const response = await fetch('/api/bot/guilds');
        if (!response.ok) {
          throw new Error('Failed to fetch guilds');
        }
        const data = await response.json();
        setGuilds(data.guilds || []);
      } catch (err) {
        console.error('Error fetching guilds:', err);
        setError('Failed to load Discord servers');
      } finally {
        setLoading(false);
      }
    };

    fetchGuilds();
  }, []);

  const handleServerSelect = (guild: Guild) => {
    if (guild.canInvite) {
      // Generate invite link for bot
      const botInviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=268487744&scope=bot%20applications.commands&guild_id=${guild.id}`;
      window.open(botInviteUrl, '_blank');
      return;
    }

    // Navigate to server management (bot is already present)
    const serverId = guild.id;
    if (onServerSelect) {
      onServerSelect(serverId);
    } else {
      router.push(`/dashboard/server/${serverId}`);
    }
  };

  const getServerIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
    }
    // Default Discord server icon
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`;
  };

  const hasManagePermissions = (permissions: string) => {
    const perms = BigInt(permissions);
    const ADMINISTRATOR = BigInt(8); // 1 << 3
    const MANAGE_GUILD = BigInt(32); // 1 << 5
    const MANAGE_CHANNELS = BigInt(16); // 1 << 4
    
    return (perms & ADMINISTRATOR) === ADMINISTRATOR || 
           (perms & MANAGE_GUILD) === MANAGE_GUILD || 
           (perms & MANAGE_CHANNELS) === MANAGE_CHANNELS;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-300 mx-auto"></div>
          <p className="text-purple-100 mt-4 text-xl">Loading your Discord servers...</p>
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
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const managableGuilds = guilds.filter(guild => 
    guild.owner || hasManagePermissions(guild.permissions)
  );

  // Filter based on toggle state
  const filteredGuilds = showInviteServers 
    ? managableGuilds 
    : managableGuilds.filter(guild => guild.botPresent);

  // Separate into bot-present and invite-only for display order
  const botPresentGuilds = filteredGuilds.filter(guild => guild.botPresent);
  const inviteOnlyGuilds = filteredGuilds.filter(guild => guild.canInvite);
  const orderedGuilds = [...botPresentGuilds, ...inviteOnlyGuilds];

  // Count totals for display
  const totalBotServers = managableGuilds.filter(guild => guild.botPresent).length;
  const totalInviteServers = managableGuilds.filter(guild => guild.canInvite).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-100 mb-4">
            🎮 Server Management
          </h1>
          <p className="text-purple-300 text-lg">
            Hello, <strong>chiraitori</strong>! Manage your bot or invite it to new servers
          </p>
          
          {/* Toggle Button */}
          <div className="flex justify-center items-center gap-4 mt-6 mb-4">
            <button
              onClick={() => setShowInviteServers(!showInviteServers)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                showInviteServers
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
              }`}
            >
              {showInviteServers ? '👁️ Hide Invite Servers' : '👁️‍🗨️ Show Invite Servers'}
            </button>
          </div>

          {/* Server Counts */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-purple-300">{totalBotServers} Active Servers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-400">{totalInviteServers} Available to Invite</span>
            </div>
          </div>

          <p className="text-purple-400 mt-2">
            {showInviteServers 
              ? `Showing ${orderedGuilds.length} total manageable servers`
              : `Showing ${orderedGuilds.length} servers where bot is active`
            }
          </p>
        </div>

        {/* Server Grid */}
        {orderedGuilds.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {orderedGuilds.map((guild) => (
              <div
                key={guild.id}
                onClick={() => handleServerSelect(guild)}
                className={`group relative backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 cursor-pointer hover:scale-105 ${
                  guild.canInvite 
                    ? 'bg-gray-900/50 border-gray-500/50 hover:border-gray-400/70 hover:bg-gray-800/60' 
                    : 'bg-purple-900/30 border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-800/40'
                }`}
              >
                {/* Server Icon */}
                <div className="relative mb-4">
                  <img
                    src={getServerIcon(guild)}
                    alt={guild.name}
                    className={`w-20 h-20 rounded-full mx-auto group-hover:scale-110 transition-transform duration-300 ${
                      guild.canInvite ? 'filter grayscale' : ''
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`;
                    }}
                  />
                  {guild.owner && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      👑 Owner
                    </div>
                  )}
                  {guild.canInvite && (
                    <div className="absolute -top-2 -left-2 bg-gray-600 text-gray-200 text-xs font-bold px-2 py-1 rounded-full">
                      + Invite
                    </div>
                  )}
                  {guild.botPresent && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-green-900 text-xs font-bold px-2 py-1 rounded-full">
                      ✓ Active
                    </div>
                  )}
                </div>

                {/* Server Name */}
                <div className="text-center">
                  <h3 className={`font-semibold text-sm leading-tight transition-colors ${
                    guild.canInvite 
                      ? 'text-gray-300 group-hover:text-gray-100' 
                      : 'text-purple-100 group-hover:text-white'
                  }`}>
                    {guild.name}
                  </h3>
                  {guild.canInvite && (
                    <p className="text-gray-400 text-xs mt-1">Click to invite bot</p>
                  )}
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/20 transition-all duration-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-purple-100 mb-4">No Active Bot Servers</h2>
            <p className="text-purple-300 mb-8 max-w-md mx-auto">
              The bot isn't active in any servers where you have management permissions. 
              Invite the bot to your servers first to start managing it.
            </p>
            <a
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
            >
              Return to Home
            </a>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/')}
            className="bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 hover:text-white px-6 py-3 rounded-lg transition-colors backdrop-blur-sm border border-purple-500/30"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
