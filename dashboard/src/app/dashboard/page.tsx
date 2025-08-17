'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface UserData {
  id: string;
  username: string;
  avatar: string;
  guilds: number;
}

function DashboardContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const authStatus = searchParams.get('auth');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          // Redirect to servers page after successful login
          router.push('/servers');
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-300 mx-auto"></div>
          <p className="text-purple-100 mt-4">Redirecting to server management...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-100 mb-4">Authentication Required</h1>
          <p className="text-purple-300 mb-8">Please log in to access the dashboard</p>
          <a
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-100 mb-4">
            Welcome, {userData.username}! 🎮
          </h1>
          {authStatus === 'success' && (
            <div className="bg-green-500/20 border border-green-400 text-green-200 px-4 py-2 rounded-lg inline-block mb-4">
              ✅ Successfully logged in with Discord!
            </div>
          )}
          <p className="text-purple-300">
            You have access to {userData.guilds} Discord servers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-purple-100 mb-4">Server Management</h3>
            <p className="text-purple-300 mb-4">Manage bot settings for your Discord servers</p>
            <button 
              onClick={() => router.push('/servers')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Manage Servers
            </button>
          </div>

          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-purple-100 mb-4">Bot Configuration</h3>
            <p className="text-purple-300 mb-4">Configure auto-send settings and preferences</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
              Configure Bot
            </button>
          </div>

          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-purple-100 mb-4">Live Codes</h3>
            <p className="text-purple-300 mb-4">View and manage active redemption codes</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
              View Codes
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => {
              // Logout functionality
              fetch('/api/auth/logout', { method: 'POST' })
                .then(() => window.location.href = '/');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-purple-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}
