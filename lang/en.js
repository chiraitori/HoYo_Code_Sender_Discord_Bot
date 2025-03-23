const { version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
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
            loading: 'Loading codes...'
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
            noPermission: 'You do not have permission to use this command.',
            loading: 'Setting up code notifications...',
            success: 'Setup completed successfully!',
            roleSetup: '{role} will be mentioned for {type} codes',
            channelSetup: 'Notifications will be sent to {channel}',
            autoSendSetup: 'Auto-send feature: {status}',
            noRole: 'no role set',
            notificationsEnabled: '{game}: Notifications {status}',
            notificationsDisabled: '{game}: Notifications {status} {reason}',
            rolesHeader: 'Roles Set:',
            noRolesWarning: 'No roles set. You won\'t receive notifications for any games.',
            gameNotificationsHeader: 'Game Notifications:',
            error: {
                permissions: 'I need View Channel, Send Messages, and Embed Links permissions in the target channel.',
                general: 'An error occurred during setup. Please try again.'
            }
        },
        redeem: {
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
            embedDescription: 'A new code has been redeemed for {game}!',
            messageLabel: 'Message:',
            redeemButton: 'Click to Redeem'
        },
        toggleautosend: {
            loading: 'Updating auto-send setting...',
            success: 'Auto-send is now: **{status}**',
            error: 'Failed to update auto-send setting'
        },
        setlang: {
            success: 'Server language has been set to: **{language}**',
            error: 'Failed to set server language',
            description: 'Set the bot language for this server',
            languageOption: 'Select language'
        },
        vote: {
            title: 'Vote for HoYo Code Sender',
            description: 'Support us by voting on Top.gg! Your votes help us grow and reach more users.',
            status: 'Vote Status',
            hasVoted: '✅ Thank you for voting! You can vote again in 12 hours.',
            hasNotVoted: '❌ You haven\'t voted yet today!',
            link: 'Vote Here',
            error: 'Error checking vote status. Please try again.'
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
            donate: 'Donate'
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
        rateLimit: 'Too many requests. Please try again later.'
    },
    system: {
        startup: 'Bot is starting up...',
        ready: 'Bot is now online!',
        checking: 'Checking for new codes...',
        connected: 'Connected to database',
        disconnected: 'Disconnected from database'
    },
    common: {
        enabled: 'ENABLED',
        disabled: 'DISABLED'
    },
    games: {
        genshin: 'Genshin Impact',
        hkrpg: 'Honkai: Star Rail',
        nap: 'Zenless Zone Zero'
    }
};