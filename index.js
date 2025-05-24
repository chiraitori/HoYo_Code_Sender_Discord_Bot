require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { checkAndSendNewCodes } = require('./utils/autoCodeSend');
const { setupTopggWebhook } = require('./utils/topggWebhook');
const { sendWelcomeMessage } = require('./utils/welcome');

// Express setup
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy configuration for proper rate limiting behind reverse proxies
// This allows express-rate-limit to correctly identify users via X-Forwarded-For headers
// Required when deployed behind nginx, CloudFlare, load balancers, or other reverse proxies
// Setting this to 'true' tells Express to trust the first hop proxy
app.set('trust proxy', true);

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    // Use a more robust key generator that works well with proxies
    keyGenerator: (req) => {
        return req.ip; // This will use the real IP when trust proxy is enabled
    }
});

// Apply rate limiting to all routes
app.use(limiter);

// API-specific stricter rate limiter
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // limit each IP to 30 requests per 5 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many API requests from this IP, please try again after 5 minutes',
    // Use a more robust key generator that works well with proxies
    keyGenerator: (req) => {
        return req.ip; // This will use the real IP when trust proxy is enabled
    }
});

// Apply the API-specific limiter to API routes
app.use('/api/', apiLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Create a 'public' folder for static files

app.get('/api/codes/genshin', async (req, res) => {
    try {
        const response = await axios.get('https://hoyo-codes.seria.moe/codes?game=genshin');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

app.get('/api/codes/hsr', async (req, res) => {
    try {
        const response = await axios.get('https://hoyo-codes.seria.moe/codes?game=hkrpg');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// API Routes
app.get('/api/codes/zzz', async (req, res) => {
    try {
        const response = await axios.get('https://hoyo-codes.seria.moe/codes?game=nap');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Discord bot setup
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.MONGODB_URI) {
    throw new Error('Missing required environment variables');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        //GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();

// Register commands function
async function registerCommands() {
    try {
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            // Clear require cache
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
                console.log(`Registered command: ${command.data.name}`);
            }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Connect to MongoDB and start bot
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch(err => console.error('MongoDB connection error:', err));

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    try {
        await registerCommands();
        console.log('Commands registered successfully');
    } catch (error) {
        console.error('Error during startup:', error);
    }
    client.user.setPresence({
        activities: [{
            name: `for redemption codes | ${process.env.VERSION}`,
            type: ActivityType.Watching
        }],
        status: 'online'
    });
    
    setInterval(() => checkAndSendNewCodes(client), 5 * 60 * 1000);
});

// Add event listeners for guild join/leave
client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
    
    // Send welcome message with setup instructions
    await sendWelcomeMessage(guild, client);
});

client.on('guildDelete', (guild) => {
    console.log(`Removed from guild: ${guild.name} (${guild.id})`);
    // Optionally clean up database entries for this guild
});

// After Express and client setup
setupTopggWebhook(app, client);

// Handle interactions
client.on('interactionCreate', async interaction => {
    try {
        // Command interactions
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Command execution error:', error);
                const content = { 
                    content: 'An error occurred while executing this command.',
                    ephemeral: true 
                };

                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(content);
                } else {
                    await interaction.reply(content);
                }
            }
        }
        
        // Modal submit interactions
        if (interaction.isModalSubmit() && interaction.customId === 'redeemModal') {
            const command = client.commands.get('redeem');
            if (command?.modalSubmit) {
                await command.modalSubmit(interaction);
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});
