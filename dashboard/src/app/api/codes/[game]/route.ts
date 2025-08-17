import { NextRequest, NextResponse } from 'next/server';

// Game mapping for API compatibility
const gameMapping: Record<string, string> = {
  'genshin': 'genshin',
  'hsr': 'hkrpg',
  'zzz': 'nap'
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ game: string }> }
) {
  const { game } = await context.params;
  
  try {
    console.log(`[API] Fetching codes for game: ${game}`);
    
    // Validate game parameter
    if (!gameMapping[game]) {
      console.log(`[API] Invalid game: ${game}`);
      return NextResponse.json(
        { error: 'Invalid game. Supported games: genshin, hsr, zzz' },
        { status: 400 }
      );
    }

    const apiGame = gameMapping[game];
    const apiUrl = `https://hoyo-codes.seria.moe/codes?game=${apiGame}`;
    
    console.log(`[API] Fetching from external API: ${apiUrl}`);
    
    // Fetch from external API
    const response = await fetch(apiUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0'
      }
    });

    console.log(`[API] External API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Received ${data.codes?.length || 0} codes for ${game}`);
    
    // Transform the response to match our interface
    const codes = (data.codes || []).map((code: any) => ({
      code: code.code,
      isExpired: code.isExpired || false,
      timestamp: code.timestamp || new Date().toISOString()
    }));

    return NextResponse.json({
      game: game,
      codes: codes,
      lastUpdated: new Date().toISOString(),
      total: codes.length,
      active: codes.filter((c: any) => !c.isExpired).length,
      expired: codes.filter((c: any) => c.isExpired).length
    });

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
