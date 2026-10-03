import { NextRequest, NextResponse } from 'next/server';
import { checkMutationOrigin } from '@/lib/discordAuth';

export async function POST(request: NextRequest) {
  const denied = checkMutationOrigin(request);
  if (denied) return denied;
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('discord_access_token');
    response.cookies.delete('discord_oauth_state');
    
    // Clear the authentication cookie
    response.cookies.set('discord_user', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
