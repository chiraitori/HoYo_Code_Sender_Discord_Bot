import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    // Fetch server configuration from main bot API with authentication
    const configResponse = await fetch(createBotApiUrl(`/api/server/${serverId}/config`), createBotApiOptions());
    
    if (!configResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch server config' }, { status: configResponse.status });
    }

    const config = await configResponse.json();
    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching server config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { serverId } = resolvedParams;
    const body = await request.json();

    // Forward the request to the main bot API with authentication
    const response = await fetch(createBotApiUrl(`/api/server/${serverId}/config`), createBotApiOptions({
      method: 'PUT',
      body: JSON.stringify(body),
    }));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update config' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update server config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
