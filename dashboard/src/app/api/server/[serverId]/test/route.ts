import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions, createBotApiResponse } from '@/utils/botApiUrl';
import { authorizeGuild } from '@/lib/discordAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { serverId } = resolvedParams;
    const denied = await authorizeGuild(request, serverId);
    if (denied) return denied;

    // Forward the request to the main bot API with authentication
    const response = await fetch(createBotApiUrl(`/api/server/${serverId}/test`), createBotApiOptions({
      method: 'POST',
    }));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send test notification' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return createBotApiResponse(data);
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
