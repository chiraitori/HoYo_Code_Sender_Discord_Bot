'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Aurora from './Aurora';

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
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <Aurora colorStops={["#4b1ec8", "#00f0ff", "#ff3c96"]} speed={0.5} />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-accent-cyan mx-auto shadow-[0_0_30px_rgba(0,240,255,0.4)]"></div>
          <p className="text-white mt-8 text-2xl font-bold animate-pulse">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <Aurora colorStops={["#4b1ec8", "#ff3c96", "#4b1ec8"]} speed={0.3} />
        <div className="relative z-10 text-center px-4">
          <div className="glass-panel p-10 rounded-3xl border-red-500/30">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Connection Failed</h1>
            <p className="text-violet-200 mb-8 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="glass-button px-8 py-3 rounded-full text-white font-bold hover:text-red-300"
            >
              Try Again
            </button>
          </div>
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
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Aurora colorStops={["#2e1065", "#4c1d95", "#0f172a"]} blend={0.8} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            <span className="text-gradient drop-shadow-lg">
              Server Management
            </span>
          </h1>
          <p className="text-violet-200/80 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Welcome back, <span className="text-accent-cyan font-bold">chiraitori</span>!
            Select a server to manage configuration or invite the bot to a new community.
          </p>

          {/* Controls Container */}
          <div className="glass-panel mt-10 inline-flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border-white/5 bg-black/20">
            {/* Toggle Button */}
            <button
              onClick={() => setShowInviteServers(!showInviteServers)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${showInviteServers
                ? 'bg-violet-600/80 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-violet-200 hover:bg-white/10'
                }`}
            >
              {showInviteServers ? (
                <>
                  <span className="text-accent-pink">👁️</span> Hide Invite Servers
                </>
              ) : (
                <>
                  <span className="text-accent-cyan">👁️‍🗨️</span> Show Invite Servers
                </>
              )}
            </button>

            {/* Separator */}
            <div className="hidden sm:block w-px h-8 bg-white/10"></div>

            {/* Server Counts */}
            <div className="flex gap-6 text-sm font-medium">
              <div className="flex items-center gap-2" title="Active Servers">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-white">{totalBotServers} Active</span>
              </div>
              <div className="flex items-center gap-2" title="Available to Invite">
                <div className="w-2.5 h-2.5 bg-violet-400/50 rounded-full"></div>
                <span className="text-violet-300">{totalInviteServers} Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server Grid */}
        {orderedGuilds.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto pb-20">
            {orderedGuilds.map((guild, index) => (
              <div
                key={guild.id}
                onClick={() => handleServerSelect(guild)}
                className={`group glass-panel rounded-3xl p-6 transition-all duration-300 cursor-pointer hover:-translate-y-2 relative overflow-hidden ${guild.canInvite ? 'opacity-90 hover:opacity-100' : ''
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Glow Effect on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${guild.botPresent
                  ? 'from-violet-600/20 to-accent-cyan/20'
                  : 'from-gray-600/20 to-gray-400/20'
                  }`} />

                {/* Server Icon */}
                <div className="relative mb-5 mx-auto w-24 h-24">
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${guild.botPresent ? 'bg-violet-500' : 'bg-gray-500'
                    }`} />
                  <img
                    src={getServerIcon(guild)}
                    alt={guild.name}
                    className={`w-full h-full rounded-full relative z-10 object-cover shadow-2xl border-4 transition-all duration-300 ${guild.canInvite
                      ? 'border-white/5 grayscale group-hover:grayscale-0'
                      : 'border-violet-500/30 group-hover:border-accent-cyan/50'
                      }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`;
                    }}
                  />

                  {/* Status Badges */}
                  {guild.owner && (
                    <div className="absolute -top-1 -right-1 z-20 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-amber-200">
                      OWNER
                    </div>
                  )}
                  {guild.canInvite && (
                    <div className="absolute -bottom-3 inset-x-0 z-20 flex justify-center">
                      <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-lg group-hover:bg-violet-600 group-hover:border-violet-400 transition-colors uppercase tracking-wider">
                        Invite
                      </span>
                    </div>
                  )}
                  {guild.botPresent && (
                    <div className="absolute bottom-0 right-0 z-20 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1a1235] flex items-center justify-center text-white text-xs shadow-lg">
                      ✓
                    </div>
                  )}
                </div>

                {/* Server Name */}
                <div className="text-center relative z-10">
                  <h3 className={`font-bold text-base leading-tight mb-2 line-clamp-2 transition-colors ${guild.canInvite
                    ? 'text-violet-200/60 group-hover:text-white'
                    : 'text-white group-hover:text-accent-cyan'
                    }`}>
                    {guild.name}
                  </h3>
                  {guild.canInvite ? (
                    <p className="text-xs font-medium text-violet-300/50 group-hover:text-violet-300 transition-colors">
                      Click to invite bot
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-green-400/80 group-hover:text-green-400 transition-colors flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <div className="glass-panel max-w-2xl mx-auto rounded-[2.5rem] p-12 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
              <div className="text-8xl mb-6 opacity-80">👾</div>
              <h2 className="text-3xl font-black text-white mb-4">No Active Servers Found</h2>
              <p className="text-violet-200 mb-8 text-lg leading-relaxed">
                The bot isn't active in any servers where you have management permissions.
                Invite the bot to your community to start tracking codes automatically!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setShowInviteServers(true)}
                  className="glass-button bg-violet-600/20 text-white px-8 py-3 rounded-full font-bold hover:bg-violet-600/40"
                >
                  Show Invitable Servers
                </button>
                <a
                  href="/"
                  className="glass-button px-8 py-3 rounded-full text-violet-200 font-bold hover:text-white"
                >
                  Return Home
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Home Button */}
        <div className="text-center pb-12">
          <button
            onClick={() => router.push('/')}
            className="group inline-flex items-center gap-2 text-violet-300 hover:text-white transition-colors font-medium px-6 py-3 rounded-full hover:bg-white/5"
          >
            <span>←</span>
            <span className="group-hover:translate-x-1 transition-transform">Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
