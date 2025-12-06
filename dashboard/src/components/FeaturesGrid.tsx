'use client';

import { useState, useEffect } from 'react';
import { useBotStats } from '@/lib/BotStatsContext';

export default function FeaturesGrid() {
  const { stats: botStatsData } = useBotStats();
  const [botStats, setBotStats] = useState<{ servers: number; uptime: string } | null>(null);

  useEffect(() => {
    if (botStatsData) {
      setBotStats({
        servers: botStatsData.guildCount || botStatsData.servers || 0,
        uptime: 'Available' // Context handles uptime differently
      });
    }
  }, [botStatsData]);
  const features = [
    {
      icon: '⚡',
      title: 'Instant Notifications',
      description: 'Get notified the moment new redemption codes are released by HoYoverse',
      gradient: 'from-yellow-400/20 to-orange-400/20'
    },
    {
      icon: '🔄',
      title: 'Auto Distribution',
      description: 'Codes are automatically sent to your configured Discord channels without any manual work',
      gradient: 'from-blue-400/20 to-purple-400/20'
    },
    {
      icon: '🎯',
      title: 'Multi-Game Support',
      description: 'Support for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero all in one bot',
      gradient: 'from-purple-400/20 to-pink-400/20'
    },
    {
      icon: '🌍',
      title: 'Multiple Languages',
      description: 'Bot responses available in English, Japanese, and Vietnamese for global communities',
      gradient: 'from-green-400/20 to-teal-400/20'
    },
    {
      icon: '🛡️',
      title: 'Role-Based Notifications',
      description: 'Configure specific roles to be pinged for different games and manage who gets notified',
      gradient: 'from-red-400/20 to-pink-400/20'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Track code distribution, server activity, and user engagement with detailed analytics',
      gradient: 'from-indigo-400/20 to-purple-400/20'
    },
    {
      icon: '⚙️',
      title: 'Easy Configuration',
      description: 'Simple slash commands to set up channels, roles, and preferences in minutes',
      gradient: 'from-gray-400/20 to-slate-400/20'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Built with security in mind, 99.9% uptime, and regularly updated with new features',
      gradient: 'from-emerald-400/20 to-green-400/20'
    }
  ];

  const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => (
    <div
      className="group bg-gradient-to-br from-purple-800/30 to-purple-700/20 backdrop-blur-sm border border-purple-300/20 rounded-2xl p-6 hover:from-purple-700/40 hover:to-purple-600/30 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-300/20"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-purple-300/30 rounded-2xl mb-6 text-3xl group-hover:scale-110 transition-transform duration-300`}>
        {feature.icon}
      </div>

      <h3 className="text-xl font-bold text-purple-50 mb-3 group-hover:text-purple-100 transition-colors">
        {feature.title}
      </h3>

      <p className="text-purple-100/70 leading-relaxed group-hover:text-purple-100/80 transition-colors">
        {feature.description}
      </p>
    </div>
  );

  return (
    <div className="py-20 px-4" style={{ background: 'transparent' }}>
      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-6" style={{
            backgroundImage: `linear-gradient(to right, rgb(213, 203, 225), rgb(154, 145, 193))`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            Powerful Features
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
            Everything you need to keep your Discord community up-to-date with the latest HoYoverse redemption codes
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Additional info section */}
        <div className="mt-20">
          <div className="backdrop-blur-sm border rounded-3xl p-8 lg:p-12" style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(111, 98, 157, 0.3)'
          }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: 'rgb(213, 203, 225)' }}>
                  Why Choose HoYo Code Sender?
                </h3>
                <p className="mb-6 leading-relaxed" style={{ color: 'rgba(213, 203, 225, 0.8)' }}>
                  We've built the most reliable and feature-rich HoYoverse code distribution bot for Discord.
                  Our bot ensures your community never misses out on free rewards and exclusive content from
                  Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span style={{ color: 'rgb(213, 203, 225)' }}>
                      {botStats ? `Active in ${botStats.servers.toLocaleString()} servers` : 'Growing community of Discord servers'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span style={{ color: 'rgb(213, 203, 225)' }}>Automatic code detection and distribution</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span style={{ color: 'rgb(213, 203, 225)' }}>24/7 monitoring and instant updates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-purple-100">Open source and community driven</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-purple-100">Easy setup with role-based notifications</span>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-right">
                <div className="inline-block">
                  <div className="text-8xl mb-4">🎮</div>
                  <div className="text-2xl font-bold text-purple-100 mb-2">
                    Ready to get started?
                  </div>
                  <div className="text-purple-100/80 mb-6">
                    Join our growing community of server owners
                  </div>
                  <a
                    href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2048&scope=bot%20applications.commands`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-300 to-purple-100 text-purple-900 px-6 py-3 rounded-full font-bold hover:from-purple-100 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-300/50"
                  >
                    <span>Add to Discord</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
