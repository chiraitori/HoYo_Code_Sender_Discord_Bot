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
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <GlassSurface 
        width="100%" 
        height={80}
        borderRadius={24}
        className="mx-auto max-w-7xl"
        displace={15}
        distortionScale={-150}
        redOffset={5}
        greenOffset={15}
        blueOffset={25}
        brightness={60}
        opacity={0.8}
        mixBlendMode="screen"
        backgroundOpacity={0.1}
        saturation={1.2}
      >
        <nav className="w-full px-6">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎮</div>
              <button 
                onClick={() => router.push('/')}
                className="text-xl font-bold text-white drop-shadow-lg hover:scale-105 transition-transform duration-200"
              >
                HoYo Code Sender
              </button>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {loading ? (
                <div className="flex items-center space-x-4">
                  <div className="animate-pulse bg-white/20 h-8 w-20 rounded-lg"></div>
                  <div className="animate-pulse bg-white/20 h-8 w-20 rounded-lg"></div>
                </div>
              ) : isLoggedIn ? (
                <>
                  <button 
                    onClick={() => router.push('/')}
                    className={`text-white/90 hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10 ${
                      isActivePage('/') ? 'bg-white/20 text-white' : ''
                    }`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => router.push('/servers')}
                    className={`text-white/90 hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10 ${
                      isActivePage('/servers') ? 'bg-white/20 text-white' : ''
                    }`}
                  >
                    Servers
                  </button>
                  <button 
                    onClick={() => router.push('/codes')}
                    className={`text-white/90 hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10 ${
                      isActivePage('/codes') ? 'bg-white/20 text-white' : ''
                    }`}
                  >
                    Codes
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="#features" 
                    className="text-white/90 hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    Features
                  </a>
                  <button 
                    onClick={() => router.push('/codes')}
                    className="text-white/90 hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    View Codes
                  </button>
                </>
              )}
            </div>

            {/* User Profile / Login Button */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse bg-white/20 h-10 w-32 rounded-lg"></div>
              ) : isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user?.avatar && (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                      />
                    )}
                    <span className="text-sm text-white font-medium">
                      {user?.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/70 hover:text-red-300 transition-colors duration-200 px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <GlassSurface
                  width={160}
                  height={40}
                  borderRadius={12}
                  brightness={80}
                  opacity={0.9}
                  displace={8}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <button 
                    className="text-white font-medium text-sm w-full h-full"
                    onClick={handleLogin}
                  >
                    Login to Manage
                  </button>
                </GlassSurface>
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

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden mt-4">
          <GlassSurface 
            width="100%" 
            height="auto"
            borderRadius={16}
            className="mx-auto max-w-7xl"
            brightness={60}
            opacity={0.9}
            backgroundOpacity={0.1}
          >
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="animate-pulse bg-white/20 h-8 w-full rounded"></div>
                  <div className="animate-pulse bg-white/20 h-8 w-full rounded"></div>
                </div>
              ) : isLoggedIn ? (
                <>
                  <div className="flex items-center space-x-3 p-3 border-b border-white/20 mb-3">
                    {user?.avatar && (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                      />
                    )}
                    <span className="text-sm text-white font-medium">
                      {user?.username}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      router.push('/');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActivePage('/') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      router.push('/servers');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActivePage('/servers') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Servers
                  </button>
                  <button
                    onClick={() => {
                      router.push('/codes');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActivePage('/codes') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Codes
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-lg font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="#features"
                    className="block px-3 py-2 rounded-lg font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Features
                  </a>
                  <button
                    onClick={() => {
                      router.push('/codes');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    View Codes
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 mt-3"
                  >
                    Login with Discord
                  </button>
                </>
              )}
            </div>
          </GlassSurface>
        </div>
      )}
    </header>
  );
}
