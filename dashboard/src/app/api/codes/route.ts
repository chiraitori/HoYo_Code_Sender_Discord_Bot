import { NextResponse } from 'next/server';

const games = ['genshin', 'hsr', 'zzz'];
const gameMapping: Record<string, string> = {
  'genshin': 'genshin',
  'hsr': 'hkrpg',
  'zzz': 'nap'
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

        const data = await response.json();
        const codes = (data.codes || []).map((code: any) => ({
          code: code.code,
          isExpired: code.isExpired || false,
          timestamp: code.timestamp || new Date().toISOString()
        }));

        return {
          game,
          codes,
          total: codes.length,
          active: codes.filter((c: any) => !c.isExpired).length,
          expired: codes.filter((c: any) => c.isExpired).length
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

    return NextResponse.json({
      games: results,
      summary,
      lastUpdated: new Date().toISOString()
    });

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
