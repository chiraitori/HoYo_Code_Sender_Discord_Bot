import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions, createBotApiResponse } from '@/utils/botApiUrl';
import { getUserGuilds, canManageGuild } from '@/lib/discordAuth';

// Discord API Guild interface
interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

// Bot API Guild interface
interface BotGuild {
  id: string;
  name?: string;
}

// Enhanced Guild interface with bot presence info
interface EnhancedGuild extends DiscordGuild {
  botPresent: boolean;
  canInvite: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const userGuilds = await getUserGuilds(request);
    if (userGuilds instanceof NextResponse) return userGuilds;
    
    // Fetch bot guilds from our bot API
    let botGuilds = [];
    try {
      const botResponse = await fetch(createBotApiUrl('/api/bot/guilds'), createBotApiOptions());
      if (botResponse.ok) {
        const botData = await botResponse.json();
        botGuilds = botData.guilds || [];
      }
    } catch (error) {
      console.warn('Failed to fetch bot guilds:', error);
    }

    // Filter user guilds where the user has management permissions
    const managementGuilds = userGuilds.filter(canManageGuild);

    // Combine data to show bot presence
    const enhancedGuilds = managementGuilds.map((guild: DiscordGuild): EnhancedGuild => {
      const botPresent = botGuilds.some((botGuild: BotGuild) => botGuild.id === guild.id);
      return {
        ...guild,
        botPresent,
        canInvite: !botPresent
      };
    });

    return createBotApiResponse({
      guilds: enhancedGuilds,
      total: enhancedGuilds.length,
    });

  } catch (error) {
    console.error('Error fetching guilds:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Discord servers',
      guilds: [],
      total: 0 
    }, { status: 500 });
  }
}
