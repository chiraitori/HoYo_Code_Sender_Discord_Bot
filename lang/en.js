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
            channelSetup: 'Channel {channel} will receive code notifications'
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
    }
};