import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('discord_user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userData = JSON.parse(userCookie.value);
    
    return NextResponse.json({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      guilds: userData.guilds || 0
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Failed to check authentication' }, { status: 500 });
  }
}
