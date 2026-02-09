'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HOYO_GAME_ICONS } from '../../../../utils/discordGameIcons';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
}

interface ServerSettings {
  autoSendEnabled: boolean;
  favoriteGames: {
    enabled: boolean;
    games: {
      genshin: boolean;
      hkrpg: boolean; // hkrpg = HSR
      nap: boolean;   // nap = ZZZ
    };
  };
}

export default function ServerOverview() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  const [guild, setGuild] = useState<Guild | null>(null);
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guildRes, settingsRes] = await Promise.all([
          fetch(`/api/bot/guild/${serverId}`),
          fetch(`/api/server/${serverId}/settings`)
        ]);

        if (guildRes.ok) setGuild(await guildRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error("Failed to fetch overview data", error);
      } finally {
        setLoading(false);
      }
    };

    if (serverId) fetchData();
  }, [serverId]);

  const getServerIcon = (guild: Guild) => {
    if (guild.icon) return guild.icon;
    // Fallback for no icon (default discord avatars)
    try {
      return `https://cdn.discordapp.com/embed/avatars/${(BigInt(guild.id) >> 22n) % 6n}.png`;
    } catch (e) {
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
  };

  // Helper to determine active games display
  const getActiveGames = () => {
    if (!settings?.favoriteGames.enabled) return ['genshin', 'hkrpg', 'nap']; // If filter disabled, all are "active" by default conceptually
    const games = [];
    if (settings.favoriteGames.games.genshin) games.push('genshin');
    if (settings.favoriteGames.games.hkrpg) games.push('hkrpg');
    if (settings.favoriteGames.games.nap) games.push('nap');
    return games;
  };

  const activeGames = getActiveGames();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center gap-6 glass-panel p-8 rounded-3xl border-white/5 bg-gradient-to-r from-violet-900/20 to-transparent">
        {guild && (
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-accent-cyan rounded-full blur-xl opacity-20 animate-pulse"></div>
            <img
              src={getServerIcon(guild)}
              alt={guild.name}
              className="w-full h-full rounded-2xl relative z-10 border border-white/10 shadow-2xl object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-violet-200/60 text-lg">
            Manage <span className="text-accent-cyan font-bold">{guild?.name || 'Server'}</span> settings and view insights.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-2xl">
            📡
          </div>
          <div>
            <h3 className="text-violet-200/60 text-sm font-medium uppercase tracking-wider">Bot Status</h3>
            <p className="text-green-400 font-bold text-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Active
            </p>
          </div>
        </div>

        {/* Auto-Send Card */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-cyan/20 flex items-center justify-center text-2xl">
            📨
          </div>
          <div>
            <h3 className="text-violet-200/60 text-sm font-medium uppercase tracking-wider">Auto-Send</h3>
            <p className={`font-bold text-xl ${settings?.autoSendEnabled ? 'text-white' : 'text-white/50'}`}>
              {loading ? '...' : settings?.autoSendEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>



        {/* Games Card */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-pink/20 flex items-center justify-center text-2xl">
            🎮
          </div>
          <div>
            <h3 className="text-violet-200/60 text-sm font-medium uppercase tracking-wider">Tracked Games</h3>
            <div className="flex -space-x-3 mt-2">
              <div className={`relative w-10 h-10 rounded-full border-2 border-[#1a1a20] transition-all hover:scale-110 hover:z-10 ${activeGames.includes('genshin') ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'}`} title="Genshin Impact">
                <img src={HOYO_GAME_ICONS.genshin} alt="Genshin" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className={`relative w-10 h-10 rounded-full border-2 border-[#1a1a20] transition-all hover:scale-110 hover:z-10 ${activeGames.includes('hkrpg') ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'}`} title="Honkai: Star Rail">
                <img src={HOYO_GAME_ICONS.hsr} alt="HSR" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className={`relative w-10 h-10 rounded-full border-2 border-[#1a1a20] transition-all hover:scale-110 hover:z-10 ${activeGames.includes('nap') ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'}`} title="Zenless Zone Zero">
                <img src={HOYO_GAME_ICONS.zzz} alt="ZZZ" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-white mt-8 mb-4 flex items-center gap-2">
        <span className="text-accent-cyan">⚡</span> Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => router.push(`/dashboard/server/${serverId}/config`)}
          className="glass-panel p-6 rounded-2xl border-white/5 hover:border-accent-cyan/50 hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
            <span className="text-violet-200/40 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </div>
          <h3 className="text-white font-bold mb-1">Configure Bot</h3>
          <p className="text-sm text-violet-200/50">Setup channels, roles, and game preferences.</p>
        </button>

        <button
          className="glass-panel p-6 rounded-2xl border-white/5 hover:border-accent-pink/50 hover:bg-white/5 transition-all text-left group grayscale opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">📊</span>
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">Coming Soon</span>
          </div>
          <h3 className="text-white font-bold mb-1">Detailed Analytics</h3>
          <p className="text-sm text-violet-200/50">View code redemption stats and engagement.</p>
        </button>
      </div>
    </div>
  );
}
