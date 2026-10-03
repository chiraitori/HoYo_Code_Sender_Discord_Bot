import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    // Handle OAuth error
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }

  if (!code) {
    // No authorization code received
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const state = searchParams.get('state');
  const expectedState = request.cookies.get('discord_oauth_state')?.value;
  if (!state || !expectedState || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(expectedState)
    || !timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
    return NextResponse.redirect(new URL('/?error=invalid_oauth_state', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: new URL('/auth/callback', process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).toString(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();

    // Get user's guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });

    const guildsData = guildsResponse.ok ? await guildsResponse.json() : [];

    // Store authentication data and redirect directly to server management
    const response = NextResponse.redirect(new URL('/servers?auth=success', request.url));
    response.cookies.delete('discord_oauth_state');
    
    // Set secure cookies with user data
    response.cookies.set('discord_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenData.expires_in,
    });

    response.cookies.set('discord_user', JSON.stringify({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      guilds: guildsData.length,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenData.expires_in,
    });

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_processing_failed', request.url));
  }
}
