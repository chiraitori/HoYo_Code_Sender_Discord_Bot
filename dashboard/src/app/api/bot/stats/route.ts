import { NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

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
      ...data,
      servers: data.guildCount || data.servers || 0,
      guildCount: data.guildCount || data.servers || 0
    };
    
    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch bot stats. Make sure the Discord bot is running on port 3000.',
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
