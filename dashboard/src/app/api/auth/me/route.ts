import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/discordAuth';

export async function GET(request: NextRequest) {
  try {
    const token = getAccessToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', signal: AbortSignal.timeout(10000)
    });
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Discord session expired or unavailable' }, {
        status: userResponse.status === 401 ? 401 : 503
      });
    }
    const userData = await userResponse.json();
    
    return NextResponse.json({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      guilds: 0
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Failed to check authentication' }, { status: 500 });
  }
}
