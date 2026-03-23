// delete-year-messages.js
// This script will delete the year change messages from all Discord channels
// Usage: node delete-year-messages.js

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Config = require('./models/Config');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

async function deleteYearMessages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Logging in to Discord...');
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Logged in as', client.user.tag);

        // Wait a moment for Discord to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get all guild configurations
        const configs = await Config.find({}).lean();
        console.log(`Found ${configs.length} guild configurations`);

        let deletedCount = 0;
        let errorCount = 0;

        for (const config of configs) {
            try {
                const guild = client.guilds.cache.get(config.guildId);
                if (!guild) {
                    console.log(`Guild ${config.guildId} not found, skipping`);
                    continue;
                }

                const channel = client.channels.cache.get(config.channel);
                if (!channel) {
                    console.log(`Channel not found for guild ${guild.name}, skipping`);
                    continue;
                }

                console.log(`Checking ${guild.name} - #${channel.name}...`);

                // Fetch recent messages (last 100)
                const messages = await channel.messages.fetch({ limit: 100 });

                // Find messages from the bot with the year change title
                const yearMessages = messages.filter(msg =>
                    msg.author.id === client.user.id &&
                    msg.embeds.length > 0 &&
                    msg.embeds[0].title &&
                    msg.embeds[0].title.includes('Happy New Year 2025')
                );

                if (yearMessages.size > 0) {
                    console.log(`Found ${yearMessages.size} year message(s) in ${guild.name}`);

                    for (const [, message] of yearMessages) {
                        try {
                            await message.delete();
                            deletedCount++;
                            console.log(`✅ Deleted message in ${guild.name}`);
                            // Add a small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (deleteError) {
                            console.error(`❌ Failed to delete message in ${guild.name}:`, deleteError.message);
                            errorCount++;
                        }
                    }
                } else {
                    console.log(`No year messages found in ${guild.name}`);
                }

            } catch (error) {
                console.error(`Error processing guild ${config.guildId}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n=== DELETION COMPLETE ===');
        console.log(`✅ Successfully deleted: ${deletedCount} messages`);
        console.log(`❌ Errors encountered: ${errorCount}`);

        await client.destroy();
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

deleteYearMessages();
