import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    // Fetch server settings from main bot API with authentication
    const settingsResponse = await fetch(createBotApiUrl(`/api/server/${serverId}/settings`), createBotApiOptions());
    
    if (!settingsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch server settings' }, { status: settingsResponse.status });
    }

    const settings = await settingsResponse.json();
    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching server settings:', error);
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
    const response = await fetch(createBotApiUrl(`/api/server/${serverId}/settings`), createBotApiOptions({
      method: 'PUT',
      body: JSON.stringify(body),
    }));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update server settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
