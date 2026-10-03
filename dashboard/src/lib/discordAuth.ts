import { NextRequest, NextResponse } from 'next/server';

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export function getAccessToken(request: NextRequest): string | null {
  const token = request.cookies.get('discord_access_token')?.value;
  if (token) return token;
  try {
    const legacy = JSON.parse(request.cookies.get('discord_user')?.value || '{}');
    return typeof legacy.access_token === 'string' ? legacy.access_token : null;
  } catch {
    return null;
  }
}

export function canManageGuild(guild: DiscordGuild): boolean {
  try {
    const permissions = BigInt(guild.permissions);
    return guild.owner || (permissions & BigInt(8)) !== BigInt(0)
      || (permissions & BigInt(32)) !== BigInt(0)
      || (permissions & BigInt(16)) !== BigInt(0);
  } catch {
    return false;
  }
}

export function checkMutationOrigin(request: NextRequest): NextResponse | null {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return null;
  const expectedOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (request.headers.get('origin') !== expectedOrigin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  return null;
}

const guildRequests = new Map<string, Promise<DiscordGuild[] | NextResponse>>();

export async function getUserGuilds(request: NextRequest): Promise<DiscordGuild[] | NextResponse> {
  const token = getAccessToken(request);
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const pending = guildRequests.get(token);
  if (pending) {
    const result = await pending;
    return result instanceof NextResponse
      ? new NextResponse(result.clone().body, { status: result.status, headers: result.headers })
      : result;
  }

  const lookup = (async () => {
    try {
      const guilds: DiscordGuild[] = [];
      let after = '';
      do {
        const response = await fetch(`https://discord.com/api/users/@me/guilds?limit=200${after ? `&after=${after}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
          return NextResponse.json({ error: 'Could not verify Discord permissions' }, {
            status: response.status === 401 || response.status === 403 ? 401 : 503
          });
        }
        const page = await response.json() as DiscordGuild[];
        guilds.push(...page);
        if (page.length < 200) break;
        const next = page[page.length - 1].id;
        if (next === after) break;
        after = next;
      } while (after);
      return guilds;
    } catch {
      return NextResponse.json({ error: 'Could not verify Discord permissions' }, { status: 503 });
    }
  })();
  guildRequests.set(token, lookup);
  try {
    return await lookup;
  } finally {
    guildRequests.delete(token);
  }
}

export async function authorizeGuild(request: NextRequest, guildId: string): Promise<NextResponse | null> {
  if (!/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
  }
  const originError = checkMutationOrigin(request);
  if (originError) return originError;
  const guilds = await getUserGuilds(request);
  if (guilds instanceof NextResponse) return guilds;
  if (!guilds.some(guild => guild.id === guildId && canManageGuild(guild))) {
    return NextResponse.json({ error: 'You cannot manage this server' }, { status: 403 });
  }
  return null;
}
import 'server-only';
