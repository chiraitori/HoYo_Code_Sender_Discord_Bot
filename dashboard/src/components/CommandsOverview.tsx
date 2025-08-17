'use client';

import { useState, useEffect } from 'react';
interface Command {
  name: string;
  description: string;
  options: any[];
}

interface CommandData {
  commands: Command[];
  total: number;
}

export default function CommandsOverview() {
  const [commandData, setCommandData] = useState<CommandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        setLoading(true);
        // Use dashboard's own API route
        const response = await fetch('/api/bot/commands');
        if (!response.ok) {
          throw new Error(`Failed to fetch command information`);
        }
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setCommandData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch commands:', err);
        setError(err instanceof Error ? err.message : 'Failed to load command information');
        setCommandData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  const getCommandIcon = (commandName: string) => {
    const icons: { [key: string]: string } = {
      'setup': '⚙️',
      'listcodes': '📋',
      'toggleautosend': '🔄',
      'setlang': '🌐',
      'favgames': '⭐',
      'help': '❓',
      'about': 'ℹ️',
      'vote': '👍',
      'postcode': '📝',
      'checkchannels': '📺',
      'deletesetup': '🗑️'
    };
    return icons[commandName] || '⚡';
  };

  const getCategoryColor = (commandName: string) => {
    if (['setup', 'toggleautosend', 'setlang', 'favgames', 'checkchannels', 'deletesetup'].includes(commandName)) {
      return 'from-blue-500 to-blue-600'; // Configuration
    }
    if (['listcodes', 'postcode'].includes(commandName)) {
      return 'from-green-500 to-green-600'; // Code Management
    }
    if (['help', 'about', 'vote'].includes(commandName)) {
      return 'from-purple-500 to-purple-600'; // Information
    }
    return 'from-gray-500 to-gray-600'; // Default
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-purple-200 to-purple-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-purple-900 mb-4">Bot Commands</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-purple-200 to-purple-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-purple-900 mb-4">Available Commands</h2>
          <p className="text-purple-700 max-w-2xl mx-auto">
            Complete list of slash commands available in the HoYo Code Sender bot
          </p>
          {error && (
            <div className="mt-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded-lg inline-block">
              ⚠️ {error}
            </div>
          )}
        </div>

        {commandData && (
          <>
            {/* Command Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-2xl font-bold text-purple-900">{commandData.total}</div>
                  <div className="text-purple-700">Total Commands</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚙️</div>
                  <div className="text-2xl font-bold text-purple-900">6</div>
                  <div className="text-purple-700">Configuration</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <div className="text-2xl font-bold text-purple-900">3</div>
                  <div className="text-purple-700">Code Management</div>
                </div>
              </div>
            </div>

            {/* Commands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commandData.commands.map((command) => (
                <div key={command.name} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${getCategoryColor(command.name)} text-white text-xl flex-shrink-0`}>
                      {getCommandIcon(command.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-purple-900 text-lg mb-2">
                        /{command.name}
                      </h3>
                      <p className="text-purple-600 text-sm leading-relaxed">
                        {command.description}
                      </p>
                      {command.options && command.options.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-purple-500 font-medium">
                            {command.options.length} option{command.options.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Guide */}
            <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-200 shadow-lg">
              <h3 className="text-2xl font-bold text-purple-900 mb-6 text-center">How to Use Commands</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🚀</span>
                    Getting Started
                  </h4>
                  <ol className="space-y-3 text-purple-700">
                    <li className="flex items-start">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">1</span>
                      <span>Type <code className="bg-purple-100 px-2 py-1 rounded text-sm">/setup</code> to configure the bot</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">2</span>
                      <span>Use <code className="bg-purple-100 px-2 py-1 rounded text-sm">/toggleautosend</code> to enable auto-posting</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">3</span>
                      <span>Check codes with <code className="bg-purple-100 px-2 py-1 rounded text-sm">/listcodes</code></span>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💡</span>
                    Pro Tips
                  </h4>
                  <ul className="space-y-3 text-purple-700">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>All commands are slash commands - just type <code className="bg-purple-100 px-2 py-1 rounded text-sm">/</code> to see them</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>Use <code className="bg-purple-100 px-2 py-1 rounded text-sm">/help</code> for detailed command information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>Administrator permissions required for setup commands</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
