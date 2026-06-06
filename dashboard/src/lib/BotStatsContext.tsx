'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode
} from 'react';
import { cachedFetch } from './cache';

interface BotStats {
  guildCount: number;
  userCount: number;
  channelCount: number;
  uptime: number;
  ping: number;
  status: number;
  servers?: number; // Alternative field name
  botUser: {
    username: string;
    avatar: string;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

interface BotStatsContextType {
  stats: BotStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BotStatsContext = createContext<BotStatsContextType | undefined>(undefined);

export function useBotStats() {
  const context = useContext(BotStatsContext);
  if (context === undefined) {
    throw new Error('useBotStats must be used within a BotStatsProvider');
  }
  return context;
}

interface BotStatsProviderProps {
  children: ReactNode;
}

export function BotStatsProvider({ children }: BotStatsProviderProps) {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      
      // Use cached fetch with 2-minute cache to reduce API calls
      const data = await cachedFetch<BotStats>('/api/bot/stats', {}, 2);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch bot stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bot statistics');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchStats();
      }
    };

    void fetchStats();
    const interval = window.setInterval(refreshWhenVisible, 180000);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchStats]);

  const value = useMemo<BotStatsContextType>(() => ({
    stats,
    loading,
    error,
    refetch: fetchStats
  }), [error, fetchStats, loading, stats]);

  return (
    <BotStatsContext.Provider value={value}>
      {children}
    </BotStatsContext.Provider>
  );
}
