import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('discord_user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userData = JSON.parse(userCookie.value);
    
    if (!userData.access_token) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Fetch user's guilds from Discord API
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${userData.access_token}`,
      },
    });

    if (!guildsResponse.ok) {
      throw new Error('Failed to fetch guilds from Discord');
    }

    const userGuilds = await guildsResponse.json();
    
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
    const managementGuilds = userGuilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions);
      const ADMINISTRATOR = BigInt(8); // 1 << 3
      const MANAGE_GUILD = BigInt(32); // 1 << 5
      const MANAGE_CHANNELS = BigInt(16); // 1 << 4
      
      return guild.owner || 
             (permissions & ADMINISTRATOR) === ADMINISTRATOR || 
             (permissions & MANAGE_GUILD) === MANAGE_GUILD || 
             (permissions & MANAGE_CHANNELS) === MANAGE_CHANNELS;
    });

    // Combine data to show bot presence
    const enhancedGuilds = managementGuilds.map((guild: any) => {
      const botPresent = botGuilds.some((botGuild: any) => botGuild.id === guild.id);
      return {
        ...guild,
        botPresent,
        canInvite: !botPresent
      };
    });

    return NextResponse.json({
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
