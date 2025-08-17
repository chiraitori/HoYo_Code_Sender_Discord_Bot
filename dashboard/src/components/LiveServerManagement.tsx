'use client';

import { useState, useEffect } from 'react';

interface Guild {
  id: string;
  name: string;
  memberCount: number;
  icon: string | null;
  ownerId: string;
  joinedAt: string;
}

interface GuildData {
  guilds: Guild[];
  total: number;
}

export default function ServerManagement() {
  const [guildData, setGuildData] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        setLoading(true);
        // Use dashboard's own API route
        const response = await fetch('/api/bot/guilds');
        if (!response.ok) {
          throw new Error(`Failed to fetch server information`);
        }
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setGuildData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch guild data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load server information');
        setGuildData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGuilds();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-purple-100 to-purple-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-purple-900 mb-4">Server Management</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayedGuilds = showAll ? guildData?.guilds : guildData?.guilds.slice(0, 6);
  const totalMembers = guildData?.guilds.reduce((sum, guild) => sum + guild.memberCount, 0) || 0;

  return (
    <section className="py-16 bg-gradient-to-b from-purple-100 to-purple-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-purple-900 mb-4">Server Management</h2>
          <p className="text-purple-700 max-w-2xl mx-auto">
            Monitor and manage Discord servers using the HoYo Code Sender bot
          </p>
          {error && (
            <div className="mt-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg inline-block">
              ⚠️ {error}
            </div>
          )}
        </div>

        {guildData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏰</div>
                  <div className="text-2xl font-bold text-purple-900">{guildData.total}</div>
                  <div className="text-purple-700">Total Servers</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-purple-900">{totalMembers.toLocaleString()}</div>
                  <div className="text-purple-700">Total Members</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-purple-900">{Math.round(totalMembers / guildData.total)}</div>
                  <div className="text-purple-700">Avg. Members</div>
                </div>
              </div>
            </div>

            {/* Server List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-purple-200">
                <h3 className="text-xl font-bold text-purple-900">Connected Servers</h3>
                <p className="text-purple-600 text-sm mt-1">Servers currently using the bot</p>
              </div>
              
              <div className="divide-y divide-purple-100">
                {displayedGuilds?.map((guild) => (
                  <div key={guild.id} className="p-6 hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {guild.icon ? (
                          <img 
                            src={guild.icon} 
                            alt={`${guild.name} icon`}
                            className="w-12 h-12 rounded-full border-2 border-purple-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                            {guild.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-purple-900">{guild.name}</h4>
                          <p className="text-purple-600 text-sm">
                            Joined {new Date(guild.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-900">
                          {guild.memberCount.toLocaleString()}
                        </div>
                        <div className="text-purple-600 text-sm">members</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {guildData.guilds.length > 6 && (
                <div className="p-6 border-t border-purple-200 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium"
                  >
                    {showAll ? 'Show Less' : `Show All ${guildData.total} Servers`}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔧</span>
                  Server Management
                </h3>
                <p className="text-purple-600 text-sm mb-4">
                  Configure bot settings for individual servers
                </p>
                <button className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                  Manage Settings
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  Analytics
                </h3>
                <p className="text-purple-600 text-sm mb-4">
                  View detailed statistics and usage patterns
                </p>
                <button className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                  View Analytics
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🚀</span>
                  Invite Bot
                </h3>
                <p className="text-purple-600 text-sm mb-4">
                  Add the bot to new Discord servers
                </p>
                <button className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                  Get Invite Link
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
