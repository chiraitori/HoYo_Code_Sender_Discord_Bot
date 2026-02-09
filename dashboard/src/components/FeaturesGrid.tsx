'use client';

import { useState, useEffect } from 'react';
import { useBotStats } from '@/lib/BotStatsContext';
import {
  Zap,
  RefreshCw,
  Gamepad2,
  Globe,
  Shield,
  BarChart3,
  Settings,
  Lock
} from 'lucide-react';

export default function FeaturesGrid() {
  const { stats: botStatsData } = useBotStats();
  const [botStats, setBotStats] = useState<{ servers: number; uptime: string } | null>(null);

  useEffect(() => {
    if (botStatsData) {
      setBotStats({
        servers: botStatsData.guildCount || botStatsData.servers || 0,
        uptime: 'Available'
      });
    }
  }, [botStatsData]);
  const features = [
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Get notified the moment new redemption codes are released by HoYoverse',
      gradient: 'from-amber-400 to-orange-500'
    },
    {
      icon: RefreshCw,
      title: 'Auto Distribution',
      description: 'Codes are automatically sent to your configured Discord channels without any manual work',
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Gamepad2,
      title: 'Multi-Game Support',
      description: 'Support for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero all in one bot',
      gradient: 'from-fuchsia-400 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Multiple Languages',
      description: 'Bot responses available in English, Japanese, and Vietnamese for global communities',
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      icon: Shield,
      title: 'Role-Based Notifications',
      description: 'Configure specific roles to be pinged for different games and manage who gets notified',
      gradient: 'from-rose-400 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track code distribution, server activity, and user engagement with detailed analytics',
      gradient: 'from-violet-400 to-purple-500'
    },
    {
      icon: Settings,
      title: 'Easy Configuration',
      description: 'Simple slash commands to set up channels, roles, and preferences in minutes',
      gradient: 'from-zinc-400 to-slate-500'
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Built with security in mind, 99.9% uptime, and regularly updated with new features',
      gradient: 'from-lime-400 to-green-500'
    }
  ];

  const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => (
    <div
      className="group glass-panel rounded-2xl p-6 transition-all duration-500 hover:bg-white/5 hover:scale-105 hover:shadow-2xl hover:border-white/20"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-100 transition-colors">
        {feature.title}
      </h3>

      <p className="text-violet-200/70 leading-relaxed font-medium">
        {feature.description}
      </p>
    </div>
  );

  return (
    <div className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-6">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-violet-200/80 font-medium nice-text-shadow">
            Everything you need to keep your Discord community up-to-date with the latest HoYoverse redemption codes
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Additional info section */}
        <div className="mt-24">
          <div className="glass-panel border-white/10 rounded-[2.5rem] p-10 lg:p-14 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h3 className="text-3xl md:text-4xl font-black mb-6 text-white leading-tight">
                  Why Choose <br className="hidden lg:block" />
                  <span className="text-gradient-accent">HoYo Code Sender?</span>
                </h3>
                <p className="mb-8 leading-relaxed text-lg text-violet-200/90 font-medium">
                  We've built the most reliable and feature-rich HoYoverse code distribution bot for Discord.
                  Our bot ensures your community never misses out on free rewards and exclusive content from
                  Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-violet-100 font-medium text-lg">
                      {botStats ? `Active in ${botStats.servers.toLocaleString()} servers` : 'Growing community of Discord servers'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-violet-100 font-medium text-lg">Automatic code detection and distribution</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-violet-100 font-medium text-lg">24/7 monitoring and instant updates</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-violet-100 font-medium text-lg">Open source and community driven</span>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-right relative">
                <div className="glass-panel p-8 rounded-3xl inline-block bg-black/20 backdrop-blur-xl border-white/10">
                  <div className="text-8xl mb-4 animate-bounce">🎮</div>
                  <div className="text-3xl font-black text-white mb-2">
                    Ready to get started?
                  </div>
                  <div className="text-violet-200 mb-8 font-medium">
                    Join our growing community of server owners
                  </div>
                  <a
                    href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2048&scope=bot%20applications.commands`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-white text-violet-900 px-8 py-4 rounded-full font-black text-lg hover:bg-violet-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <span>Add to Discord</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
