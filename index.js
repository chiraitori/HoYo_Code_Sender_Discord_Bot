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
const authMiddleware = require('./utils/authMiddleware');
// DISABLED: Livestream system
// const { startLivestreamChecker } = require('./utils/livestreamChecker');
// const { checkAndDistribute } = require('./utils/livestreamDistribution');

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

// Security middleware
app.use((req, res, next) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
        "img-src 'self' data: https: pic.re",
        "connect-src 'self'"
    ].join('; '));
    
    // Other security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Create a 'public' folder for static files

// Authentication middleware for protected bot API routes
app.use('/api/bot', authMiddleware);
app.use('/api/server', authMiddleware);

// Simple cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Helper function to get cached or fresh API data
async function getCachedApiData(game, apiUrl) {
    const cacheKey = `codes_${game}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    try {
        const startTime = Date.now();
        const response = await axios.get(apiUrl, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'HoYo-Code-Sender-Bot/1.0'
            }
        });
        const responseTime = Date.now() - startTime;
        
        // Log slow API responses
        if (responseTime > 5000) {
            console.warn(`⚠️  Slow API response for ${game}: ${responseTime}ms`);
        }
        
        const data = response.data;
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now(),
            responseTime
        });
        
        return data;
    } catch (error) {
        // If we have cached data, return it even if expired during error
        if (cached) {
            console.warn(`API error for ${game}, using cached data:`, error.message);
            console.log(`Using stale cached data for ${game} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
            return cached.data;
        }
        throw error;
    }
}

app.get('/api/codes/genshin', async (req, res) => {
    try {
        const data = await getCachedApiData('genshin', 'https://hoyo-codes.seria.moe/codes?game=genshin');
        res.json(data);
    } catch (error) {
        console.error('Error fetching Genshin codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

app.get('/api/codes/hsr', async (req, res) => {
    try {
        const data = await getCachedApiData('hkrpg', 'https://hoyo-codes.seria.moe/codes?game=hkrpg');
        res.json(data);
    } catch (error) {
        console.error('Error fetching HSR codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// API Routes
app.get('/api/codes/zzz', async (req, res) => {
    try {
        const data = await getCachedApiData('nap', 'https://hoyo-codes.seria.moe/codes?game=nap');
        res.json(data);
    } catch (error) {
        console.error('Error fetching ZZZ codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// Discord Bot Stats API Endpoints
app.get('/api/bot/stats', async (req, res) => {
    try {
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const stats = {
            guildCount: client.guilds.cache.size,
            userCount: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            channelCount: client.channels.cache.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            botUser: {
                username: client.user.username,
                discriminator: client.user.discriminator,
                id: client.user.id,
                avatar: client.user.displayAvatarURL({ format: 'png', size: 256 })
            },
            status: client.ws.status,
            ping: client.ws.ping,
            version: process.env.VERSION || '1.0.0',
            nodeVersion: process.version
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching bot stats:', error);
        res.status(500).json({ error: 'Failed to fetch bot stats' });
    }
});

app.get('/api/bot/guilds', async (req, res) => {
    try {
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const guilds = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL({ format: 'png', size: 128 }),
            ownerId: guild.ownerId,
            joinedAt: guild.joinedAt
        }));

        res.json({ guilds, total: guilds.length });
    } catch (error) {
        console.error('Error fetching guild info:', error);
        res.status(500).json({ error: 'Failed to fetch guild info' });
    }
});

app.get('/api/bot/commands', async (req, res) => {
    try {
        const commands = client.commands.map(command => ({
            name: command.data.name,
            description: command.data.description,
            options: command.data.options || []
        }));

        res.json({ commands, total: commands.length });
    } catch (error) {
        console.error('Error fetching commands:', error);
        res.status(500).json({ error: 'Failed to fetch commands' });
    }
});

// Individual guild info endpoint
app.get('/api/bot/guild/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        const guildInfo = {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL({ format: 'png', size: 128 }),
            ownerId: guild.ownerId,
            joinedAt: guild.joinedAt,
            description: guild.description,
            features: guild.features,
            roles: guild.roles.cache
                .filter(role => role.name !== '@everyone' && !role.managed)
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    position: role.position,
                    mentionable: role.mentionable,
                    managed: role.managed
                }))
                .sort((a, b) => b.position - a.position),
            channels: guild.channels.cache
                .filter(channel => channel.type === 0 && channel.permissionsFor(guild.members.me).has('SendMessages'))
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position
                }))
                .sort((a, b) => a.position - b.position)
        };

        res.json(guildInfo);
    } catch (error) {
        console.error('Error fetching guild info:', error);
        res.status(500).json({ error: 'Failed to fetch guild info' });
    }
});

// Server configuration endpoint
app.get('/api/server/:serverId/config', async (req, res) => {
    try {
        const { serverId } = req.params;
        
        const Config = require('./models/Config');
        const config = await Config.findOne({ guildId: serverId });
        
        if (!config) {
            return res.json({
                guildId: serverId,
                genshinRole: null,
                hsrRole: null,
                zzzRole: null,
                channel: null
            });
        }

        res.json({
            guildId: config.guildId,
            genshinRole: config.genshinRole,
            hsrRole: config.hsrRole,
            zzzRole: config.zzzRole,
            channel: config.channel
        });
    } catch (error) {
        console.error('Error fetching server config:', error);
        res.status(500).json({ error: 'Failed to fetch server config' });
    }
});

// Update server config endpoint
app.put('/api/server/:serverId/config', async (req, res) => {
    try {
        const { serverId } = req.params;
        const updateData = req.body;
        
        const Config = require('./models/Config');
        
        // Find existing config or create new one
        let config = await Config.findOne({ guildId: serverId });
        
        if (!config) {
            config = new Config({
                guildId: serverId,
                genshinRole: null,
                hsrRole: null,
                zzzRole: null,
                channel: null
            });
        }

        // Update fields that are provided
        if (updateData.hasOwnProperty('genshinRole')) {
            config.genshinRole = updateData.genshinRole;
        }
        if (updateData.hasOwnProperty('hsrRole')) {
            config.hsrRole = updateData.hsrRole;
        }
        if (updateData.hasOwnProperty('zzzRole')) {
            config.zzzRole = updateData.zzzRole;
        }
        if (updateData.hasOwnProperty('channel')) {
            config.channel = updateData.channel;
        }

        await config.save();

        res.json({
            guildId: config.guildId,
            genshinRole: config.genshinRole,
            hsrRole: config.hsrRole,
            zzzRole: config.zzzRole,
            channel: config.channel
        });
    } catch (error) {
        console.error('Error updating server config:', error);
        res.status(500).json({ error: 'Failed to update server config' });
    }
});

// Server settings endpoint
app.get('/api/server/:serverId/settings', async (req, res) => {
    try {
        const { serverId } = req.params;
        
        const Settings = require('./models/Settings');
        const settings = await Settings.findOne({ guildId: serverId });
        
        if (!settings) {
            return res.json({
                guildId: serverId,
                autoSendEnabled: false,
                favoriteGames: {
                    enabled: false,
                    games: {
                        genshin: false,
                        hkrpg: false,
                        nap: false
                    }
                }
            });
        }

        res.json({
            guildId: settings.guildId,
            autoSendEnabled: settings.autoSendEnabled,
            favoriteGames: settings.favoriteGames
        });
    } catch (error) {
        console.error('Error fetching server settings:', error);
        res.status(500).json({ error: 'Failed to fetch server settings' });
    }
});

// Update server settings endpoint
app.put('/api/server/:serverId/settings', async (req, res) => {
    try {
        const { serverId } = req.params;
        const updateData = req.body;
        
        const Settings = require('./models/Settings');
        
        // Find existing settings or create new one
        let settings = await Settings.findOne({ guildId: serverId });
        
        if (!settings) {
            settings = new Settings({
                guildId: serverId,
                autoSendEnabled: false,
                favoriteGames: {
                    enabled: false,
                    games: {
                        genshin: false,
                        hkrpg: false,
                        nap: false
                    }
                }
            });
        }

        // Update fields that are provided
        if (updateData.hasOwnProperty('autoSendEnabled')) {
            settings.autoSendEnabled = updateData.autoSendEnabled;
        }
        
        if (updateData.favoriteGames) {
            if (updateData.favoriteGames.hasOwnProperty('enabled')) {
                settings.favoriteGames.enabled = updateData.favoriteGames.enabled;
            }
            if (updateData.favoriteGames.games) {
                Object.assign(settings.favoriteGames.games, updateData.favoriteGames.games);
            }
        }

        await settings.save();

        res.json({
            guildId: settings.guildId,
            autoSendEnabled: settings.autoSendEnabled,
            favoriteGames: settings.favoriteGames
        });
    } catch (error) {
        console.error('Error updating server settings:', error);
        res.status(500).json({ error: 'Failed to update server settings' });
    }
});

// Test notification endpoint
app.post('/api/server/:serverId/test', async (req, res) => {
    try {
        const { serverId } = req.params;
        
        const Config = require('./models/Config');
        const config = await Config.findOne({ guildId: serverId });
        
        if (!config || !config.channel) {
            return res.status(400).json({ error: 'No notification channel configured' });
        }

        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const channel = guild.channels.cache.get(config.channel);
        if (!channel) {
            return res.status(400).json({ error: 'Notification channel not found' });
        }

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🧪 Test Notification')
            .setDescription('This is a test notification from HoYo Code Sender!')
            .addFields(
                { name: '✅ Channel', value: `<#${config.channel}>`, inline: true },
                { name: '🤖 Bot', value: 'Working correctly!', inline: true }
            )
            .setFooter({ text: 'Test completed successfully' })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        
        res.json({ success: true, message: 'Test notification sent successfully!' });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Reset configuration endpoint
app.post('/api/server/:serverId/reset', async (req, res) => {
    try {
        const { serverId } = req.params;
        
        const Config = require('./models/Config');
        const Settings = require('./models/Settings');
        const Language = require('./models/Language');
        
        // Delete all configuration data for this server
        await Promise.all([
            Config.deleteOne({ guildId: serverId }),
            Settings.deleteOne({ guildId: serverId }),
            Language.deleteOne({ guildId: serverId })
        ]);
        
        res.json({ success: true, message: 'Configuration reset successfully!' });
    } catch (error) {
        console.error('Error resetting configuration:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

// Clear old cache entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of apiCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) { // Clear if 2x older than cache duration
            apiCache.delete(key);
        }
    }
}, 60 * 60 * 1000); // Every hour

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Discord bot setup - Enhanced environment validation
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID', 
    'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Optional environment variables with warnings
const optionalEnvVars = {
    'WEBHOOK_PASSWORD': 'Top.gg webhook functionality will be disabled',
    'TOPGG_TOKEN': 'Vote checking functionality will be limited',
    'VERSION': 'Version display will show as undefined'
};

Object.entries(optionalEnvVars).forEach(([varName, warning]) => {
    if (!process.env[varName]) {
        console.warn(`⚠️  Optional environment variable missing: ${varName} - ${warning}`);
    }
});

console.log('✅ Environment validation completed');

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
    
    // Start regular code checking (every 5 minutes)
    setInterval(() => checkAndSendNewCodes(client), 1 * 60 * 1000);
    
    // DISABLED: Livestream code checker (every 3 minutes)
    // startLivestreamChecker(client);
    
    // DISABLED: Check for distribution every 3 minutes (runs alongside checker)
    // setInterval(() => checkAndDistribute(client), 3 * 60 * 1000);
});

// Memory monitoring (optional)
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
            rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100
        };
        
        // Log memory usage every 30 minutes
        console.log(`Memory usage: RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB`);
        
        // Warn if memory usage is high
        if (memUsageMB.heapUsed > 200) {
            console.warn('High memory usage detected');
        }
    }, 30 * 60 * 1000); // Every 30 minutes
}


// Add event listeners for guild join/leave
client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
    
    // Send welcome message with setup instructions
    await sendWelcomeMessage(guild, client);
});

client.on('guildDelete', async (guild) => {
    console.log(`Removed from guild: ${guild.name} (${guild.id})`);
    
    // Clean up database entries for this guild
    try {
        const Config = require('./models/Config');
        const Settings = require('./models/Settings');
        const Language = require('./models/Language');
        
        await Promise.all([
            Config.deleteOne({ guildId: guild.id }),
            Settings.deleteOne({ guildId: guild.id }),
            Language.deleteOne({ guildId: guild.id })
        ]);
        
        console.log(`Cleaned up configuration for guild: ${guild.name} (${guild.id})`);
    } catch (error) {
        console.error(`Error cleaning up guild ${guild.id}:`, error);
    }
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
