// Discord Application IDs for HoYoverse games
export const DISCORD_GAME_IDS = {
  genshin: '762434991303950386',
  hsr: '1076606886650359898', 
  zzz: '1139522809762377828'
} as const;

// Alternative: Use HoYoverse official game icons from their CDN
export const HOYO_GAME_ICONS = {
  genshin: 'https://play-lh.googleusercontent.com/-gSYfE68AvxlSAiKzXThyDw1-iUlwBJGsJBAXllBA8i_NM7kvft32U2DYSmQFglaOaw=s256-rw',
  hsr: 'https://img.utdstc.com/icon/68d/131/68d13114b6d60f8570133274979c031fbee9e46e01608957469627de6f4f6e1e:200',
  zzz: 'https://img.utdstc.com/icon/aa7/3cf/aa73cff70dbc44cc34ca16d5ec0d19d2d3465a52ef5ff019f4b602e7d316e534:100'
} as const;

// Game mapping for consistent naming
export const GAME_MAPPING = {
  'genshin': 'genshin',
  'hkrpg': 'hsr',
  'nap': 'zzz'
} as const;

export type GameId = keyof typeof DISCORD_GAME_IDS;
export type ApiGameId = keyof typeof GAME_MAPPING;

/**
 * Get Discord game icon URL from application ID
 * @param gameId - The game identifier (genshin, hsr, zzz)
 * @param size - Icon size (16, 32, 64, 128, 256, 512, 1024, 2048, 4096)
 * @returns Discord CDN URL for the game icon
 */
export function getDiscordGameIcon(gameId: GameId, size: number = 256): string {
  // First try HoYoverse official icons (more reliable)
  const hoyoIcon = HOYO_GAME_ICONS[gameId];
  if (hoyoIcon) {
    return hoyoIcon;
  }
  
  // Fallback to Discord CDN (might not work without proper authentication)
  const appId = DISCORD_GAME_IDS[gameId];
  if (!appId) {
    console.warn(`No Discord app ID found for game: ${gameId}`);
    return '';
  }
  
  // For now, we'll use a generic Discord application icon URL
  // The actual icon hash would need to be fetched from Discord's API
  // This will work if the applications have public icons
  return `https://cdn.discordapp.com/app-icons/${appId}.png?size=${size}`;
}

/**
 * Map API game IDs to Discord game IDs
 * @param apiGameId - API game identifier (genshin, hkrpg, nap)
 * @returns Discord game identifier (genshin, hsr, zzz)
 */
export function mapApiGameToDiscord(apiGameId: ApiGameId): GameId {
  return GAME_MAPPING[apiGameId];
}

/**
 * Get game icon with fallback to emoji
 * @param gameId - The game identifier
 * @param size - Icon size for Discord CDN
 * @returns Object with Discord icon URL and fallback emoji
 */
export function getGameIconWithFallback(gameId: GameId | ApiGameId, size: number = 256) {
  // Map API game ID to Discord game ID if needed
  const discordGameId: GameId = gameId in GAME_MAPPING ? mapApiGameToDiscord(gameId as ApiGameId) : gameId as GameId;
  
  const discordIcon = getDiscordGameIcon(discordGameId, size);
  
  const fallbackEmojis: Record<GameId, string> = {
    genshin: '⚔️',
    hsr: '🚂', 
    zzz: '🏙️'
  };
  
  const gameNames: Record<GameId, string> = {
    genshin: 'Genshin Impact',
    hsr: 'Honkai: Star Rail',
    zzz: 'Zenless Zone Zero'
  };
  
  return {
    discordIcon,
    fallbackEmoji: fallbackEmojis[discordGameId],
    name: gameNames[discordGameId],
    hasDiscordIcon: !!discordIcon
  };
}

/**
 * Component for displaying game icon with Discord fallback
 */
export interface GameIconProps {
  gameId: GameId | ApiGameId;
  size?: number;
  className?: string;
  showName?: boolean;
}

/**
 * Get inline styles for game icon display
 */
export function getGameIconStyles(size: number = 32) {
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '8px',
    objectFit: 'cover' as const,
    backgroundColor: 'rgba(111, 98, 157, 0.1)',
    border: '1px solid rgba(111, 98, 157, 0.2)'
  };
}
