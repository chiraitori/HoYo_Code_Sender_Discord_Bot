const { version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
    games: {
        genshin: '<:genshin:1368073403231375430> Genshin Impact',
        hkrpg: '<:hsr:1368073099756703794> Honkai: Star Rail',
        nap: '<:zzz:1368073452174704763> Zenless Zone Zero'
    },
    common: {
        enabled: 'ENABLED',
        disabled: 'DISABLED',
        notYourButton: 'This button is not for you.',
        supportMsg: '❤️ Help the developer: ko-fi.com/chiraitori | github.com/sponsors/chiraitori | paypal.me/chiraitori'
    },
    welcome: {
        title: 'Thanks for Adding HoYo Code Sender!',
        description: 'Thanks for adding me to your server! I\'ll help you get HoYoverse game codes automatically.',
        setupHeader: '🔧 Quick Setup Guide',
        setupSteps: '1. Run `/setup` to configure notification channel & roles\n' +
                    '2. (Optional) Use `/favgames` to select which games to receive notifications for\n' +
                    '3. (Optional) Change the language with `/setlang`\n\n' +
                    'That\'s it! I\'ll now automatically send new game codes to your configured channel.',
        helpTip: 'For more information and tips, run `/help` anytime.',
        footer: 'HoYo Code Sender - Get your game codes automatically!',
        dmInfo: 'I couldn\'t find a suitable channel to send the welcome message in your server, so I\'m sending it to you directly.'
    },
    commands: {
        listcodes: {
            title: 'Active Codes for {game}',
            noCodes: 'No active codes found for {game}',
            reward: 'Reward: {reward}',
            status: 'Status: {status}',
            redeemButton: 'Click to Redeem',
            redeemHeader: 'Redeem Here',
            newCodes: 'New {game} Codes!',
            noReward: 'No reward specified',
            error: {
                fetch: 'Error fetching codes. Please try again later.',
                invalid: 'Invalid response from API',
                notFound: 'No codes available'
            },
            loading: 'Loading codes...',
            page: 'Page'
        },        
        setup: {
            description: 'Setup roles and channel for code notifications',
            genshinRole: 'Role for Genshin Impact notifications',
            hsrRole: 'Role for Honkai: Star Rail notifications',
            zzzRole: 'Role for Zenless Zone Zero notifications',
            channel: 'Channel for code notifications',
            success: 'Server configuration completed successfully!',
            error: 'Setup failed',
            roleSetup: 'Role {role} has been set for {type} notifications',
            channelSetup: 'Channel {channel} will receive code notifications',
            autoSendSetup: 'Auto-send feature: {status}',
            noPermission: 'You do not have permission to use this command',
            channelValidation: '✅ Channel validated successfully! Bot can send messages here.',
            demoTipHeader: '💡 Testing Tip',
            demoTipText: 'You can test your setup right away by using the `/demoautosend` command to send demo notification messages.',
            error: {
                channelValidation: 'Channel validation failed'
            }
        },
        demoautosend: {
            noPermission: 'You need administrator permissions to use this command.',
            noConfig: 'Bot is not set up yet! Please use `/setup` first to configure a channel.',
            channelError: 'Cannot send messages to the configured channel:',
            title: '🔔 Demo {game} Codes!',
            notice: '⚠️ Demo Notice',
            noticeText: 'These are demo codes for testing purposes only. They will not work in-game.',
            success: 'Successfully sent demo codes for {count} game(s)!',
            error: 'An error occurred while sending demo codes.'
        },
        deletesetup: {
            noPermission: 'You do not have permission to use this command.',
            loading: 'Deleting server configuration...',
            success: 'Server configuration has been successfully deleted.',
            noConfig: 'No configuration found for this server.',
            error: 'An error occurred while deleting server configuration.',
            deletedItemsHeader: 'Deleted items:',
            deletedConfig: 'Channel and role settings',
            deletedSettings: 'Notification settings',
            deletedLanguage: 'Language settings'
        },
        postcode: {
            modalTitle: 'Add Redemption Codes',
            inputLabels: {
                games: 'Select Game (genshin/hsr/zzz)',
                code1: 'Code 1 (Required)',
                code2: 'Code 2 (Optional)',
                code3: 'Code 3 (Optional)',
                message: 'Additional Message (Optional)'
            },
            description: 'Show redeem instructions and codes',
            success: 'Codes have been posted successfully!',
            error: 'Error occurred while processing the command',
            noPermission: 'You do not have permission to use this command',
            embedTitle: 'New Code Redeemed',
            invalidGame: 'Invalid game. Please use: genshin, hsr, or zzz',
            noCode: 'At least one code is required.',
            embedDescription: 'A new code has been redeemed for {game}!',
            messageLabel: 'Message:',
            redeemButton: 'Click to Redeem'
        },
        toggleautosend: {
            loading: 'Updating auto-send setting...',
            success: 'Auto-send is now: **{status}**',
            error: 'Failed to update auto-send setting',
            noPermission: 'You do not have permission to use this command'
        },
        favgames: {
            noPermission: 'You do not have permission to use this command.',
            loading: 'Setting up favorite games...',
            success: 'Favorite games configured successfully!',
            error: 'An error occurred while setting favorite games.',
            filterStatus: 'Game filtering: **{status}**',
            gameStatusHeader: 'Game Notifications:',
            allGamesEnabled: 'You will receive notifications for all games.'
        },
        help: {
            title: 'HoYo Code Sender Help',
            description: 'HoYo Code Sender automatically notifies your server about new redemption codes for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero.',
            setupHeader: '📌 Initial Setup',
            setupSteps: '1. Run `/setup` to configure:\n' +
                        '   • Choose a notification channel\n' +
                        '   • Set roles for each game (to mention when codes arrive)\n' +
                        '   • Enable/disable automatic code sending\n\n' +
                        '2. Customize your experience:\n' +
                        '   • `/favgames` - Choose which games to receive codes for\n' +
                        '   • `/setlang` - Change the bot\'s language\n' +
                        '   • `/toggleautosend` - Enable/disable automatic code notifications',
            commandsHeader: '📋 Available Commands',
            commandsList: '• `/setup` - Initial bot setup\n' +
                        '• `/favgames` - Choose which games to receive codes for\n' +
                        '• `/toggleautosend` - Turn automatic notifications on/off\n' +
                        '• `/listcodes` - Show active codes for a game\n' +
                        '• `/redeem` - Send specific codes to your channel\n' +
                        '• `/demoautosend` - Send demo codes to test notifications\n' +
                        '• `/setlang` - Change bot language (English/Vietnamese/Japanese)\n' +
                        '• `/help` - Show this help message\n' +
                        '• `/about` - Information about the bot',
            tipsHeader: '💡 Tips & Tricks',            
            tipsList: '• The bot checks for new codes every 5 minutes\n' +
                    '• You can manually post codes with `/redeem`\n' +
                    '• After setup, use `/demoautosend` to test the notification system\n' +
                    '• Use `/favgames` to filter notifications by game\n' +
                    '• Set different roles for each game type\n' +
                    '• Server admins can run `/setup` again to change settings',
            footer: 'HoYo Code Sender - Get HoYoverse game codes automatically!',
            error: 'An error occurred while loading help information.'
        },
        about: {
            title: 'About HoYo Code Sender',
            description: 'HoYo Code Sender is a Discord bot that automatically announces new codes for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero by Hoyovers.',
            version: 'Version:',
            sourceCode: 'Source Code',
            inviteLink: 'Invite Link',
            supportServer: 'Support Server',
            vote: 'Vote for the bot',
            github: 'GitHub Repository',
            devbio: 'Developer Bio',
            donate: 'Donate',
            sponsor: 'GitHub Sponsors'
        },
        vote: {
            title: 'Vote for HoYo Code Sender',
            description: 'Support the bot by voting on Top.gg! Your vote helps us reach more servers and improve the bot.',
            status: 'Vote Status',
            hasVoted: '✅ You have voted recently! Thank you for your support.',
            hasNotVoted: '❌ You haven\'t voted in the last 12 hours.',
            link: 'Vote on Top.gg',
            error: 'Error checking vote status.',
            voteAgain: 'You can vote again in 12 hours.',
            thankTitle: 'Thank You for Your Vote! 🎉',
            thankMessage: 'Thank you for supporting HoYo Code Sender on Top.gg! Your vote helps us grow and reach more users.',
            dmThankTitle: 'Thank You for Your Vote!',
            dmThankMessage: 'Thank you for voting for HoYo Code Sender on Top.gg! Your support means a lot to us.'
        },
        deletesetup: {
            noPermission: 'You do not have permission to use this command.',
            loading: 'Deleting server configuration...',
            success: 'Server configuration has been successfully deleted.',
            noConfig: 'No configuration found for this server.',
            error: 'An error occurred while deleting server configuration.',
            deletedItems: 'Deleted items:',
            deletedConfig: 'Channel and role settings',
            deletedSettings: 'Notification settings',
            deletedLanguage: 'Language settings'
        },
        togglegame: {
            noPermission: 'You do not have permission to use this command.',
            loading: 'Processing your request...',
            enabledWithNewRole: '✅ **{game}** notifications have been enabled with role {role}.',
            enabledWithExistingRole: '✅ **{game}** notifications have been enabled with existing role {role}.',
            enabledNoRole: '⚠️ **{game}** notifications have been enabled, but no role is set. Add a role with `{command}` or notifications will be sent without mentioning anyone.',
            disabled: '❌ **{game}** notifications have been disabled.',
            error: 'An error occurred while toggling game notifications.'
        }
    },
    errors: {
        general: 'An error occurred. Please try again.',
        api: 'Error connecting to API',
        database: 'Database error occurred',
        invalidChannel: 'Error: Could not find the configured channel',
        noConfig: 'Error: Channel not configured for this server',
        rateLimit: 'Too many requests. Please try again later.',
        dmNotAllowed: '❌ The `/{command}` command can only be used in Discord servers, not in direct messages.\n\n' +
                     'Please use this command in a server where the HoYo Code Sender bot is installed.'
    },
    system: {
        startup: 'Bot is starting up...',
        ready: 'Bot is now online!',
        checking: 'Checking for new codes...',
        connected: 'Connected to database',
        disconnected: 'Disconnected from database'
    }
};