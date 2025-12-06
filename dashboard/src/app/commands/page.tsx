'use client';

import { useState, useEffect } from 'react';
import Aurora from '@/components/Aurora';
import FluidGlassHeader from '@/components/FluidGlassHeader';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Command {
  name: string;
  description: string;
  usage: string;
  category: string;
  example?: string;
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await fetch('/api/bot/commands');
      if (response.ok) {
        const data = await response.json();
        setCommands(data.commands || []);
      } else {
        // Fallback commands if API fails
        setCommands([
          {
            name: 'setup',
            description: 'Setup the bot in your server',
            usage: '/setup <channel>',
            category: 'Setup',
            example: '/setup #redemption-codes'
          },
          {
            name: 'deletesetup',
            description: 'Remove bot setup from your server',
            usage: '/deletesetup',
            category: 'Setup'
          },
          {
            name: 'checkchannels',
            description: 'Check current bot channels in your server',
            usage: '/checkchannels',
            category: 'Management'
          },
          {
            name: 'toggleautosend',
            description: 'Toggle automatic code sending',
            usage: '/toggleautosend',
            category: 'Management'
          },
          {
            name: 'postcode',
            description: 'Manually post a redemption code',
            usage: '/postcode <game> <code>',
            category: 'Codes',
            example: '/postcode genshin GENSHINGIFT'
          },
          {
            name: 'listcodes',
            description: 'List all available codes for a game',
            usage: '/listcodes <game>',
            category: 'Codes',
            example: '/listcodes starrail'
          },
          {
            name: 'setlang',
            description: 'Set the language for bot messages',
            usage: '/setlang <language>',
            category: 'Settings',
            example: '/setlang en'
          },
          {
            name: 'help',
            description: 'Show all available commands',
            usage: '/help',
            category: 'Information'
          },
          {
            name: 'about',
            description: 'Show information about the bot',
            usage: '/about',
            category: 'Information'
          },
          {
            name: 'vote',
            description: 'Get the vote link for the bot',
            usage: '/vote',
            category: 'Information'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
      // Fallback to static commands on error
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(commands.map(cmd => cmd.category)))];
  const filteredCommands = selectedCategory === 'All'
    ? commands
    : commands.filter(cmd => cmd.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Setup': return '⚙️';
      case 'Management': return '🔧';
      case 'Codes': return '🎁';
      case 'Settings': return '📋';
      case 'Information': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <Aurora />
      <FluidGlassHeader />

      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent mb-6">
              Bot Commands
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Comprehensive list of all available commands for the HoYo Code Sender Discord bot
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                  >
                    {category === 'All' ? '📋' : getCategoryIcon(category)} {category}
                  </button>
                ))}
              </div>

              {/* Commands Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommands.map((command, index) => (
                  <div
                    key={command.name}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{getCategoryIcon(command.category)}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">/{command.name}</h3>
                        <span className="text-sm text-purple-300">{command.category}</span>
                      </div>
                    </div>

                    <p className="text-white/80 mb-4">{command.description}</p>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-purple-300">Usage:</span>
                        <code className="block mt-1 p-2 bg-black/30 rounded text-sm text-green-300 font-mono">
                          {command.usage}
                        </code>
                      </div>

                      {command.example && (
                        <div>
                          <span className="text-sm font-medium text-purple-300">Example:</span>
                          <code className="block mt-1 p-2 bg-black/30 rounded text-sm text-blue-300 font-mono">
                            {command.example}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredCommands.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-semibold text-white mb-2">No commands found</h3>
                  <p className="text-white/60">Try selecting a different category</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-16 text-center">
                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
                  <h3 className="text-2xl font-semibold text-white mb-4">Need Help?</h3>
                  <p className="text-white/70 mb-6">
                    If you need additional help with any command, join our support server or use the <code className="bg-black/30 px-2 py-1 rounded">/help</code> command in Discord.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a
                      href="https://discord.gg/your-support-server"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      Join Support Server
                    </a>
                    <a
                      href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2048&scope=bot%20applications.commands`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full border border-white/20 transition-all duration-300 transform hover:scale-105"
                    >
                      Add Bot to Server
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
