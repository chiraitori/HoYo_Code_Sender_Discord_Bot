import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { serverId } = resolvedParams;

    // Forward the request to the main bot API with authentication
    const response = await fetch(createBotApiUrl(`/api/server/${serverId}/reset`), createBotApiOptions({
      method: 'POST',
    }));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to reset configuration' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to reset configuration:', error);
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    );
  }
}
