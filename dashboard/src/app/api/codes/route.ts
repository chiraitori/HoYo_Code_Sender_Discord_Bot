import { NextResponse } from 'next/server';

type GameId = 'genshin' | 'hsr' | 'zzz';

interface ExternalCode {
  code: string;
  isExpired?: boolean;
  timestamp?: string;
}

interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

const games: GameId[] = ['genshin', 'hsr', 'zzz'];
const gameMapping: Record<GameId, string> = {
  genshin: 'genshin',
  hsr: 'hkrpg',
  zzz: 'nap'
};

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
};

export async function GET() {
  try {
    // Fetch codes for all games in parallel
    const promises = games.map(async (game) => {
      try {
        const apiGame = gameMapping[game];
        const response = await fetch(`https://hoyo-codes.seria.moe/codes?game=${apiGame}`, {
          next: { revalidate: 300 }, // Cache for 5 minutes
          headers: {
            'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${game} codes`);
        }

        const data = await response.json() as { codes?: ExternalCode[] };
        const generatedAt = new Date().toISOString();
        const codes: GameCode[] = (data.codes || []).map(code => ({
          code: code.code,
          isExpired: code.isExpired ?? false,
          timestamp: code.timestamp || generatedAt
        }));

        return {
          game,
          codes,
          total: codes.length,
          active: codes.filter(code => !code.isExpired).length,
          expired: codes.filter(code => code.isExpired).length
        };
      } catch (error) {
        console.error(`Error fetching ${game} codes:`, error);
        return {
          game,
          codes: [],
          total: 0,
          active: 0,
          expired: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Calculate summary stats
    const summary = results.reduce((acc, game) => ({
      totalCodes: acc.totalCodes + game.total,
      totalActive: acc.totalActive + game.active,
      totalExpired: acc.totalExpired + game.expired
    }), { totalCodes: 0, totalActive: 0, totalExpired: 0 });

    return NextResponse.json(
      {
        games: results,
        summary,
        lastUpdated: new Date().toISOString()
      },
      { headers: CACHE_HEADERS }
    );

  } catch (error) {
    console.error('Error fetching all game codes:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch codes',
        message: error instanceof Error ? error.message : 'Unknown error',
        games: [],
        summary: { totalCodes: 0, totalActive: 0, totalExpired: 0 },
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
