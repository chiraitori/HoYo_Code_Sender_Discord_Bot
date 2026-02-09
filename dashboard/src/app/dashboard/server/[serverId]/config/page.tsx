'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomSelect from '../../../../../components/CustomSelect';

interface ServerConfig {
    guildId: string;
    genshinRole: string | null;
    hsrRole: string | null;
    zzzRole: string | null;
    channel: string | null;
    livestreamChannel: string | null;
}

interface Guild {
    id: string;
    name: string;
    icon: string | null;
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

export default function ServerConfiguration() {
    const params = useParams();
    const router = useRouter();
    const serverId = params.serverId as string;

    const [guild, setGuild] = useState<Guild | null>(null);
    const [config, setConfig] = useState<ServerConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchServerData = async () => {
            try {
                const [guildRes, configRes] = await Promise.all([
                    fetch(`/api/bot/guild/${serverId}`),
                    fetch(`/api/server/${serverId}/config`)
                ]);

                if (guildRes.ok) setGuild(await guildRes.json());
                if (configRes.ok) setConfig(await configRes.json());

            } catch (err) {
                console.error('Error fetching server data:', err);
                setError('Failed to load server data');
            } finally {
                setLoading(false);
            }
        };

        if (serverId) fetchServerData();
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

    const testNotifications = async () => {
        try {
            const response = await fetch(`/api/server/${serverId}/test`, {
                method: 'POST',
            });

            if (response.ok) {
                showToast('Test notification sent!');
            } else {
                showToast('Failed to send test notification');
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            showToast('Failed to send test notification');
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
                showToast('Role updated successfully');
            }
        } catch (error) {
            console.error(`Failed to update ${gameType} role:`, error);
        }
    };

    const updateChannel = async (type: 'main' | 'livestream', channelId: string) => {
        try {
            const field = type === 'main' ? 'channel' : 'livestreamChannel';
            const response = await fetch(`/api/server/${serverId}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: channelId }),
            });

            if (response.ok) {
                setConfig({ ...config!, [field]: channelId });
                showToast(`${type === 'main' ? 'Main' : 'Livestream'} channel updated`);
            }
        } catch (error) {
            console.error('Failed to update notification channel:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
                    <p className="text-violet-200/50">Loading configuration...</p>
                </div>
            </div>
        );
    }

    // Format channels for CustomSelect
    const channelOptions = guild?.channels?.map(c => ({ value: c.id, label: `#${c.name}` })) || [];

    // Format roles for CustomSelect
    const roleOptions = [
        { value: '', label: 'No notification role' },
        ...(guild?.roles?.map(r => ({ value: r.id, label: `@${r.name}` })) || [])
    ];

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
                            Configuration
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

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">

                {/* Left Column: Channels & Test */}
                <div className="space-y-6">

                    {/* Channel Configuration */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5 relative group">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3 relative z-10">
                            <span className="text-accent-pink">📢</span> Notifications
                        </h2>

                        <div className="space-y-6 relative z-10">
                            {/* Main Channel */}
                            <div>
                                <CustomSelect
                                    label="Main Notification Channel"
                                    value={config?.channel || ''}
                                    onChange={(val) => updateChannel('main', val)}
                                    options={channelOptions}
                                    placeholder="Select a channel..."
                                />
                            </div>

                            {/* Livestream Channel */}
                            <div>
                                <CustomSelect
                                    label="Livestream Codes Channel"
                                    icon="🔴"
                                    value={config?.livestreamChannel || ''}
                                    onChange={(val) => updateChannel('livestream', val)}
                                    options={[{ value: '', label: 'Use Main Channel (Default)' }, ...channelOptions]}
                                    placeholder="Use Main Channel (Default)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5">
                        <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-widest opacity-60">
                            Verification
                        </h2>

                        <button
                            onClick={testNotifications}
                            className="w-full glass-button bg-green-500/10 text-green-300 hover:bg-green-500/20 p-4 rounded-xl font-bold flex items-center justify-center gap-2 group border-green-500/20 text-sm transition-all hover:bg-green-500/30"
                        >
                            <div className="p-2 rounded-full bg-green-500/20 group-hover:scale-110 transition-transform">
                                <span className="text-xl">📨</span>
                            </div>
                            <span>Send Test Message</span>
                        </button>
                    </div>

                </div>

                {/* Right Column: Roles */}
                <div className="space-y-6">

                    {/* Game Roles */}
                    <div className="glass-panel p-8 rounded-2xl border-white/5 relative group">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3 relative z-10">
                            <span className="text-accent-cyan">🎮</span> Role Mentions
                        </h2>

                        <div className="space-y-5 relative z-10">
                            {[
                                { id: 'genshin', label: 'Genshin Impact', field: 'genshinRole', color: 'text-violet-300' },
                                { id: 'hsr', label: 'Honkai: Star Rail', field: 'hsrRole', color: 'text-accent-cyan' },
                                { id: 'zzz', label: 'Zenless Zone Zero', field: 'zzzRole', color: 'text-accent-pink' }
                            ].map((game) => (
                                <div key={game.id}>
                                    <CustomSelect
                                        label={game.label}
                                        // @ts-expect-error - Dynamic field access on config object
                                        value={config?.[game.field] || ''}
                                        onChange={(val) => updateRole(game.id as any, val)}
                                        options={roleOptions}
                                        placeholder="No notification role"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
