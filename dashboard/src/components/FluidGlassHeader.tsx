'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GlassSurface from '../styles/GlassSurface';

interface UserData {
  id: string;
  username: string;
  avatar: string;
}

export default function FluidGlassHeader() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = encodeURIComponent('identify guilds');
    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = discordOAuthUrl;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActivePage = (path: string) => {
    return pathname === path;
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-7xl">
        <GlassSurface
          width="100%"
          height={64}
          borderRadius={24}
          displace={15}
          distortionScale={-150}
          redOffset={5}
          greenOffset={15}
          blueOffset={25}
          brightness={60}
          opacity={0.7}
          mixBlendMode="screen"
          backgroundOpacity={0.05}
          saturation={1.2}
          className="shadow-2xl shadow-violet-900/20"
        >
          <nav className="w-full px-4 sm:px-6">
            <div className="flex items-center justify-between h-full">
              {/* Logo */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                <div className="text-2xl sm:text-3xl filter drop-shadow hover:rotate-12 transition-transform duration-300">🎮</div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white drop-shadow-md leading-none tracking-tight">
                    HoYo Code
                  </span>
                  <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">
                    Sender
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                {loading ? (
                  <div className="flex items-center space-x-4">
                    <div className="animate-pulse bg-white/10 h-8 w-20 rounded-lg"></div>
                    <div className="animate-pulse bg-white/10 h-8 w-20 rounded-lg"></div>
                  </div>
                ) : isLoggedIn ? (
                  <>
                    <button
                      onClick={() => router.push('/')}
                      className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${isActivePage('/')
                        ? 'bg-white/10 text-white shadow-lg shadow-violet-500/10'
                        : 'text-violet-200/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Home
                    </button>
                    <button
                      onClick={() => router.push('/servers')}
                      className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${isActivePage('/servers')
                        ? 'bg-white/10 text-white shadow-lg shadow-violet-500/10'
                        : 'text-violet-200/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Servers
                    </button>
                    <button
                      onClick={() => router.push('/codes')}
                      className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${isActivePage('/codes')
                        ? 'bg-white/10 text-white shadow-lg shadow-violet-500/10'
                        : 'text-violet-200/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Codes
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="#features"
                      className="text-violet-200/80 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5 text-sm"
                    >
                      Features
                    </a>
                    <button
                      onClick={() => router.push('/codes')}
                      className="text-violet-200/80 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5 text-sm"
                    >
                      View Codes
                    </button>
                  </>
                )}
              </div>

              {/* User Profile / Login Button */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {loading ? (
                  <div className="animate-pulse bg-white/10 h-9 w-24 rounded-lg"></div>
                ) : isLoggedIn ? (
                  <div className="hidden sm:flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center space-x-2">
                      {user?.avatar && (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                          alt="Profile"
                          className="w-6 h-6 rounded-full border border-white/50"
                        />
                      )}
                      <span className="text-xs text-white font-bold tracking-wide uppercase">
                        {user?.username}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-red-300 hover:text-red-200 font-medium transition-colors"
                    >
                      LOGOUT
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:block">
                    <button
                      className="text-white font-bold text-xs bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 px-6 py-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-cyan-400/20"
                      onClick={handleLogin}
                    >
                      LOGIN TO MANAGE
                    </button>
                  </div>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        </GlassSurface>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden mt-4 pointer-events-auto">
          <div className="glass-panel mx-auto max-w-7xl rounded-2xl p-4 space-y-2 border border-white/10">
            {loading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-white/10 h-10 w-full rounded"></div>
                <div className="animate-pulse bg-white/10 h-10 w-full rounded"></div>
              </div>
            ) : isLoggedIn ? (
              <>
                <div className="flex items-center space-x-3 p-3 border-b border-white/10 mb-3 bg-white/5 rounded-lg">
                  {user?.avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white/30"
                    />
                  )}
                  <span className="text-sm text-white font-bold">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={() => {
                    router.push('/');
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${isActivePage('/')
                    ? 'bg-violet-600/50 text-white'
                    : 'text-violet-200 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    router.push('/servers');
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${isActivePage('/servers')
                    ? 'bg-violet-600/50 text-white'
                    : 'text-violet-200 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Servers
                </button>
                <button
                  onClick={() => {
                    router.push('/codes');
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${isActivePage('/codes')
                    ? 'bg-violet-600/50 text-white'
                    : 'text-violet-200 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Codes
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="block px-4 py-3 rounded-xl font-medium text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Features
                </a>
                <button
                  onClick={() => {
                    router.push('/codes');
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl font-medium text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  View Codes
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-500 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 mt-4 shadow-lg shadow-violet-900/50"
                >
                  Login with Discord
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
