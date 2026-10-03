import { NextResponse } from 'next/server';
import { games, loadGameCodes } from '@/lib/gameCodes';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
};

export async function GET() {
  try {
    // Fetch codes for all games in parallel
    const promises = games.map(async (game) => {
      try {
        const codes = await loadGameCodes(game);

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
          error: 'Failed to fetch codes'
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
