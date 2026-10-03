import 'server-only';
import { createBotApiUrl } from '../utils/botApiUrl';

export type GameId = 'genshin' | 'hsr' | 'zzz';
export const games: GameId[] = ['genshin', 'hsr', 'zzz'];
const gameMapping = { genshin: 'genshin', hsr: 'hkrpg', zzz: 'nap' };

interface ExternalCode {
  code: string;
  status?: string;
  isExpired?: boolean;
  timestamp?: string;
  offlineAt?: number;
  offline_at?: number;
}

export function normalizeGameCodes(rows: ExternalCode[], now = Date.now()) {
  return rows.map(row => {
    const expiry = Number(row.offlineAt || row.offline_at || 0);
    return {
      code: row.code,
      isExpired: row.isExpired === true || (row.status !== undefined && row.status !== 'OK')
        || (expiry > 0 && expiry * 1000 <= now),
      timestamp: row.timestamp || new Date(now).toISOString()
    };
  });
}

export async function loadGameCodes(game: GameId) {
  const options: RequestInit = {
    next: { revalidate: 300 }, signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0' }
  };
  if (process.env.MAIN_BOT_API_URL) {
    try {
      const response = await fetch(createBotApiUrl(`/api/codes/${game}`), options);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.codes)) return normalizeGameCodes(data.codes);
      }
    } catch {
      // Keep public code pages available when the bot API is offline.
    }
  }
  const response = await fetch(`https://hoyo-codes.seria.moe/codes?game=${gameMapping[game]}`, {
    ...options, signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Code API responded with status ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.codes)) throw new Error('Invalid code API response');
  return normalizeGameCodes(data.codes);
}
