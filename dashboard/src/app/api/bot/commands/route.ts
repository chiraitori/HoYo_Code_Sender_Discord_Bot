import { NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET() {
  try {
    // Fetch from main bot API with authentication
    const response = await fetch(createBotApiUrl('/api/bot/commands'), createBotApiOptions({
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'HoYo-Code-Sender-Dashboard/1.0'
      }
    }));

    if (!response.ok) {
      throw new Error(`Bot API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bot commands:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch bot commands. Make sure the Discord bot is running on port 3000.',
        commands: [],
        total: 0
      }, 
      { status: 503 }
    );
  }
}
