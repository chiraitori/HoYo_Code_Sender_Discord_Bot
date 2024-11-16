// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { checkAndSendNewCodes } = require('./utils/autoCodeSend');

// Validate environment variables
if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is missing in environment variables');
}

if (!process.env.CLIENT_ID) {
    throw new Error('CLIENT_ID is missing in environment variables');
}

if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in environment variables');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// Function to register commands
async function registerCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
    }

    try {
        console.log('Started refreshing application (/) commands.');
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        // Log the values being used (for debugging)
        console.log('Using Client ID:', process.env.CLIENT_ID);
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error details:', {
            error: error.message,
            code: error.code,
            status: error.status,
            url: error.url,
            requestBody: error.requestBody
        });
        throw error; // Re-throw to handle it in the calling function
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Set bot's activity status
    client.user.setPresence({
        activities: [{
            name: 'for redemption codes',
            type: ActivityType.Watching
        }],
        status: 'online'
    });

    try {
        // Register commands on startup
        await registerCommands();
        
        // Set up interval for checking new codes (every 5 minutes)
        setInterval(() => checkAndSendNewCodes(client), 5 * 60 * 1000);
    } catch (error) {
        console.error('Error during bot initialization:', error);
        // You might want to exit the process here if command registration is critical
        // process.exit(1);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction);
        } 
        else if (interaction.isModalSubmit()) {
            const command = client.commands.get('redeem');
            
            if (command && command.modalSubmit) {
                await command.modalSubmit(interaction);
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
        const response = { 
            content: 'There was an error processing your request!', 
            ephemeral: true 
        };
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);