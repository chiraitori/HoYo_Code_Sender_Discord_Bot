import { NextRequest, NextResponse } from 'next/server';
import { games, loadGameCodes, type GameId } from '@/lib/gameCodes';

// Interface for a transformed game code
interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ game: string }> }
) {
  const { game } = await context.params;
  
  try {
    // Validate game parameter
    if (!games.includes(game as GameId)) {
      return NextResponse.json(
        { error: 'Invalid game. Supported games: genshin, hsr, zzz' },
        { status: 400 }
      );
    }

    const generatedAt = new Date().toISOString();
    const codes = await loadGameCodes(game as GameId);

    return NextResponse.json(
      {
        game,
        codes,
        lastUpdated: generatedAt,
        total: codes.length,
        active: codes.filter((code: GameCode) => !code.isExpired).length,
        expired: codes.filter((code: GameCode) => code.isExpired).length
      },
      { headers: CACHE_HEADERS }
    );

  } catch (error) {
    console.error(`Error fetching codes for ${game}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch codes',
        game: game,
        codes: [],
        lastUpdated: new Date().toISOString(),
        total: 0,
        active: 0,
        expired: 0
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for development
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
