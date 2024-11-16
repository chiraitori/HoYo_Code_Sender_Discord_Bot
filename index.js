require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { checkAndSendNewCodes } = require('./utils/autoCodeSend');

// Express setup
const app = express();
const PORT = process.env.PORT || 3000;

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
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// Register commands function
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

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
    } catch (error) {
        console.error(error);
    }
}

// Connect to MongoDB and start bot
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch(err => console.error('MongoDB connection error:', err));

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    registerCommands();
    setInterval(() => checkAndSendNewCodes(client), 5 * 60 * 1000);
});

// Handle commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'Error executing command!', 
            ephemeral: true 
        });
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});