'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HOYO_GAME_ICONS } from '../../../../../utils/discordGameIcons';

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
}

export default function ServerSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const serverId = params.serverId as string;

    const [guild, setGuild] = useState<Guild | null>(null);
    const [settings, setSettings] = useState<ServerSettings | null>(null);
    const [language, setLanguage] = useState<string>('en');
    const [loading, setLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [guildRes, settingsRes, langRes] = await Promise.all([
                    fetch(`/api/bot/guild/${serverId}`),
                    fetch(`/api/server/${serverId}/settings`),
                    fetch(`/api/server/${serverId}/language`)
                ]);

                if (guildRes.ok) setGuild(await guildRes.json());
                if (settingsRes.ok) setSettings(await settingsRes.json());
                if (langRes.ok) {
                    const langData = await langRes.json();
                    setLanguage(langData.language);
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setLoading(false);
            }
        };

        if (serverId) fetchData();
    }, [serverId]);

    const getServerIcon = (guild: Guild) => {
        if (guild.icon) return guild.icon;
        try {
            return `https://cdn.discordapp.com/embed/avatars/${(BigInt(guild.id) >> 22n) % 6n}.png`;
        } catch (e) {
            return `https://cdn.discordapp.com/embed/avatars/0.png`;
        }
    };

    const showToast = (message: string) => {
        setSaveMessage(message);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const updateLanguage = async (newLang: string) => {
        try {
            const response = await fetch(`/api/server/${serverId}/language`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLang }),
            });

            if (response.ok) {
                setLanguage(newLang);
                showToast(`Language set to ${newLang.toUpperCase()}`);
            }
        } catch (error) {
            console.error('Failed to update language:', error);
        }
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
                showToast(newAutoSendState ? 'Auto-send enabled!' : 'Auto-send disabled');
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
                showToast(newFavoriteGamesState ? 'Game filtering enabled' : 'Game filtering disabled');
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
            }
        } catch (error) {
            console.error(`Failed to update ${game} preference:`, error);
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
                window.location.reload();
            } else {
                showToast('Failed to reset configuration');
            }
        } catch (error) {
            console.error('Failed to reset configuration:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
                    <p className="text-violet-200/50">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    {guild && (
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 bg-violet-500 rounded-2xl blur-lg opacity-40"></div>
                            <img
                                src={getServerIcon(guild)}
                                alt={guild.name}
                                className="w-full h-full rounded-2xl relative z-10 border border-white/10 shadow-lg object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black text-white mb-1">
                            Bot Settings
                        </h1>
                        <p className="text-violet-200/60 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            {guild?.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {saveMessage && (
                <div className="fixed bottom-8 right-8 z-50 animate-slide-in-right">
                    <div className="glass-panel px-6 py-4 rounded-xl border-l-4 border-l-green-500 bg-black/90 backdrop-blur-xl shadow-2xl flex items-center gap-4">
                        <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Success</h4>
                            <p className="text-green-200/80 text-xs">{saveMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">

                {/* Left Column: General & Language */}
                <div className="space-y-6">

                    {/* Language Settings */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5 relative overflow-hidden group">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3 relative z-10">
                            <span className="text-accent-cyan">🌐</span> Language
                        </h2>

                        <div className="relative z-10">
                            <label className="block text-violet-200/80 font-bold mb-3 text-xs uppercase tracking-wider">
                                Select Bot Language
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['en', 'jp', 'vi'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => updateLanguage(lang)}
                                        className={`px-3 py-3 rounded-xl font-bold text-sm border transition-all duration-300 flex flex-col items-center gap-1 ${language === lang
                                            ? 'bg-violet-600/50 border-accent-cyan text-white shadow-lg'
                                            : 'bg-black/20 border-white/5 text-violet-300/60 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        <span className="text-xl">{lang === 'en' ? '🇺🇸' : lang === 'jp' ? '🇯🇵' : '🇻🇳'}</span>
                                        <span>{lang === 'en' ? 'English' : lang === 'jp' ? '日本語' : 'Tiếng Việt'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Auto-Send Settings */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5 relative overflow-hidden group">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3 relative z-10">
                            <span className="text-accent-pink">⚙️</span> Automation
                        </h2>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                <div>
                                    <h3 className="text-white font-bold mb-1 text-sm">Auto-Send Codes</h3>
                                    <p className="text-xs text-violet-300/60">Automatically send new codes when found</p>
                                </div>
                                <button
                                    onClick={toggleAutoSend}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${settings?.autoSendEnabled ? 'bg-green-500' : 'bg-gray-700'
                                        }`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings?.autoSendEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Game Filters & Danger Zone */}
                <div className="space-y-6">

                    {/* Game Filters */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                            <span className="text-yellow-400">⭐</span> Game Filter
                        </h2>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 mb-6">
                            <div>
                                <h3 className="text-white font-bold mb-1 text-sm">Enable Filter</h3>
                                <p className="text-xs text-violet-300/60">Only send codes for selected games</p>
                            </div>
                            <button
                                onClick={toggleFavoriteGames}
                                className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${settings?.favoriteGames?.enabled ? 'bg-yellow-500' : 'bg-gray-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings?.favoriteGames?.enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}></div>
                            </button>
                        </div>

                        {settings?.favoriteGames?.enabled && (
                            <div className="grid grid-cols-1 gap-2 animate-fade-in">
                                {[
                                    { id: 'genshin', label: 'Genshin Impact', icon: HOYO_GAME_ICONS.genshin },
                                    { id: 'hkrpg', label: 'Honkai: Star Rail', icon: HOYO_GAME_ICONS.hsr },
                                    { id: 'nap', label: 'Zenless Zone Zero', icon: HOYO_GAME_ICONS.zzz }
                                ].map((game) => (
                                    <div key={game.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => toggleGamePreference(game.id as any)}>

                                        <div className="flex items-center gap-4">
                                            <img src={game.icon} alt={game.label} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                            <span className="text-violet-100 font-medium text-sm">{game.label}</span>
                                        </div>

                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                            // @ts-expect-error - Dynamic property access on settings object
                                            settings.favoriteGames.games[game.id] ? 'bg-yellow-500 border-yellow-500' : 'border-white/20 group-hover:border-white/40'
                                            }`}>
                                            {/* @ts-expect-error - Dynamic property access on settings object */}
                                            {settings.favoriteGames.games[game.id] && <span className="text-black text-xs font-bold">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="glass-panel p-8 rounded-2xl border-red-500/20 bg-red-500/5">
                        <h2 className="text-sm font-bold mb-4 text-red-400 uppercase tracking-widest opacity-80">
                            Danger Zone
                        </h2>

                        <button
                            onClick={resetConfiguration}
                            className="w-full glass-button bg-red-500/10 text-red-300 hover:bg-red-500/20 p-4 rounded-xl font-bold flex items-center justify-center gap-2 group border-red-500/20 text-sm transition-all hover:border-red-500/40"
                        >
                            <span className="text-lg group-hover:rotate-12 transition-transform">🗑️</span>
                            Reset All Server Data
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
