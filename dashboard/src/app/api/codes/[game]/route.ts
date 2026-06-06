import { NextRequest, NextResponse } from 'next/server';

// Interface for hoyo-codes.seria.moe API code response
interface ExternalCode {
  code: string;
  isExpired?: boolean;
  timestamp?: string;
}

// Interface for a transformed game code
interface GameCode {
  code: string;
  isExpired: boolean;
  timestamp: string;
}

// Game mapping for API compatibility
const gameMapping: Record<string, string> = {
  'genshin': 'genshin',
  'hsr': 'hkrpg',
  'zzz': 'nap'
};

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
    if (!gameMapping[game]) {
      return NextResponse.json(
        { error: 'Invalid game. Supported games: genshin, hsr, zzz' },
        { status: 400 }
      );
    }

    const apiGame = gameMapping[game];
    const apiUrl = `https://hoyo-codes.seria.moe/codes?game=${apiGame}`;
    
    // Fetch from external API
    const response = await fetch(apiUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json() as { codes?: ExternalCode[] };
    const generatedAt = new Date().toISOString();
    
    // Transform the response to match our interface
    const codes = (data.codes || []).map((code: ExternalCode): GameCode => ({
      code: code.code,
      isExpired: code.isExpired ?? false,
      timestamp: code.timestamp || generatedAt
    }));

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
        message: error instanceof Error ? error.message : 'Unknown error',
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
