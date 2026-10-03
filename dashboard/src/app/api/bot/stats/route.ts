import { NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions, createBotApiResponse } from '@/utils/botApiUrl';

export async function GET() {
  try {
    // Fetch from main bot API with authentication
    const response = await fetch(createBotApiUrl('/api/bot/stats'), createBotApiOptions({
      next: { revalidate: 30 }, // Cache for 30 seconds
      headers: {
        'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0'
      }
    }));

    if (!response.ok) {
      throw new Error(`Bot API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure consistent field names
    const normalizedData = {
      userCount: data.userCount || 0,
      channelCount: data.channelCount || 0,
      shardCount: data.shardCount || 0,
      uptime: data.uptime || 0,
      ping: data.ping ?? -1,
      status: data.status ?? 1,
      botUser: {
        id: data.botUser?.id,
        username: data.botUser?.username,
        avatar: data.botUser?.avatar,
        discriminator: data.botUser?.discriminator,
      },
      memoryUsage: {
        heapUsed: data.memoryUsage?.heapUsed || 0,
        heapTotal: data.memoryUsage?.heapTotal || 0,
        external: data.memoryUsage?.external || 0,
      },
      version: data.version,
      servers: data.guildCount || data.servers || 0,
      guildCount: data.guildCount || data.servers || 0
    };
    
    return createBotApiResponse(normalizedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    return NextResponse.json(
      { 
        error: 'Bot stats are temporarily unavailable.',
        guildCount: 0,
        servers: 0,
        userCount: 0,
        channelCount: 0,
        uptime: 0,
        ping: 0,
        status: 1,
        botUser: {
          username: 'HoYo Code Sender',
          avatar: null
        },
        memoryUsage: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0
        }
      }, 
      { status: 503 }
    );
  }
}
