import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;

    // Fetch specific guild info from main bot API with authentication
    const guildResponse = await fetch(createBotApiUrl(`/api/bot/guild/${guildId}`), createBotApiOptions());
    
    if (!guildResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch guild info' }, { status: guildResponse.status });
    }

    const guild = await guildResponse.json();
    return NextResponse.json(guild);

  } catch (error) {
    console.error('Error fetching guild info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
