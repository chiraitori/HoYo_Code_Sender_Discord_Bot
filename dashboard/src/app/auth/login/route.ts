import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'Discord login is not configured' }, { status: 503 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const state = randomBytes(32).toString('hex');
  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: new URL('/auth/callback', appUrl).toString(),
    response_type: 'code',
    scope: 'identify guilds',
    state
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set('discord_oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 600
  });
  return response;
}
