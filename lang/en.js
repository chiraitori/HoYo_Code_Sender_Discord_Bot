module.exports = {
    games: {
        genshin: 'Genshin Impact',
        hkrpg: 'Honkai: Star Rail',
        nap: 'Zenless Zone Zero'
    },
    common: {
        enabled: 'ENABLED',
        disabled: 'DISABLED',
        notYourButton: 'This button is only for the user who ran the command.',
        supportMsg: 'Support: github.com/sponsors/chiraitori | chiraitori.dev'
    },
    welcome: {
        title: 'Thanks for adding HoYo Code Sender',
        description: 'HoYo Code Sender posts new HoYoverse redemption codes to your server automatically.',
        setupHeader: '🔧 Quick setup',
        setupSteps:
            '1. Run `/setup` to choose your notification channel and ping roles.\n' +
            '2. (Optional) Run `/favgames` to choose which games to receive.\n' +
            '3. (Optional) Run `/setlang` to switch the bot language (`en`, `jp`, `vi`).\n\n' +
            'New codes will be posted automatically as soon as they go live.',
        helpTip: 'Run `/help` anytime for the full command list.',
        footer: 'HoYo Code Sender',
        dmInfo: 'No writable text channel was found in your server, so this setup guide was sent via direct message.'
    },
    commands: {
        setlang: {
            noPermission: 'You need Administrator permission to use this command.',
            success: 'Server language set to **{language}**.',
            error: 'Failed to update the server language.',
            description: 'Set the bot language for this server',
            languageOption: 'Select language'
        },
        checkchannels: {
            noPermission: 'You need Administrator permission to use this command.'
        },
        listcodes: {
            title: 'Active Codes for {game}',
            noCodes: 'No active codes found for {game}.',
            reward: 'Reward: {reward}',
            status: 'Status: {status}',
            redeemButton: 'Click to Redeem',
            redeemHeader: 'Redeem Here',
            newCodes: 'New {game} Codes!',
            noReward: 'No reward specified',
            error: {
                fetch: 'Could not fetch codes right now. Please try again shortly.',
                invalid: 'Invalid response from the code API.',
                notFound: 'No codes available.'
            },
            loading: 'Loading codes...',
            page: 'Page'
        },
        setup: {
            description: 'Configure roles and channel for code notifications',
            genshinRole: 'Role for Genshin Impact notifications',
            hsrRole: 'Role for Honkai: Star Rail notifications',
            zzzRole: 'Role for Zenless Zone Zero notifications',
            forumThreadHeader: '🧵 Forum Thread',
            forumThreadSuccess: '✅ Codes will also be posted to this thread.',
            forumThreadWarning: '⚠️ The selected forum thread is invalid or missing bot permissions, so it was skipped.',
            channel: 'Channel for code notifications',
            success: 'Server configuration saved',
            roleSetup: 'Role {role} set for {type} notifications',
            channelSetup: 'Channel {channel} will receive code notifications',
            autoSendSetup: 'Auto-send: {status}',
            noPermission: 'You need Administrator permission to use this command.',
            channelValidation: '✅ Channel verified. The bot can view, send messages, and embed links here.',
            readyMessage: 'Your server is configured to receive redemption code notifications.',
            rolesHeader: '🎭 Notification Roles',
            channelHeader: '📣 Notification Channel',
            autoSendHeader: '⚙️ Auto-Send',
            demoTipHeader: '💡 Test Your Setup',
            demoTipText: 'Run `/demoautosend` to send a sample notification to your configured channel.',
            error: {
                channelValidation: 'Channel validation failed'
            }
        },
        demoautosend: {
            noPermission: 'You need Administrator permission to use this command.',
            noConfig: 'No channel is configured yet. Run `/setup` first.',
            channelError: 'Cannot send messages to the configured channel:',
            title: '🔔 Sample {game} Codes',
            notice: '⚠️ Sample Notification',
            noticeText: 'These are sample codes for testing your channel and role setup. They cannot be redeemed in-game.',
            success: 'Sent sample notifications for {count} game(s).',
            error: 'Failed to send sample notifications.'
        },
        deletesetup: {
            noPermission: 'You need Administrator permission to use this command.',
            loading: 'Removing server configuration...',
            success: 'Server configuration deleted.',
            noConfig: 'No saved configuration was found for this server.',
            error: 'Failed to delete server configuration.',
            deletedItemsHeader: 'Removed settings:',
            deletedItems: 'Removed settings:',
            deletedConfig: 'Channels, threads, and role assignments',
            deletedSettings: 'Auto-send and game filter settings',
            deletedLanguage: 'Language preference'
        },
        postcode: {
            modalTitle: 'Post Redemption Codes',
            inputLabels: {
                games: 'Game (genshin / hsr / zzz)',
                code1: 'Code 1 (Required)',
                code2: 'Code 2 (Optional)',
                code3: 'Code 3 (Optional)',
                message: 'Note (Optional)'
            },
            description: 'Post redemption codes manually to the configured channel',
            success: 'Codes posted to the notification channel.',
            error: 'Failed to post redemption codes.',
            noPermission: 'You need Administrator permission to use this command.',
            embedTitle: 'New {game} Redemption Codes',
            embedDescription: 'New redemption codes posted for {game}.',
            invalidGame: 'Invalid game. Use `genshin`, `hsr`, or `zzz`.',
            noCode: 'Enter at least one code.',
            messageLabel: 'Note',
            redeemButton: 'Click to Redeem',
            postcodeButton: 'Click to Redeem'
        },
        toggleautosend: {
            loading: 'Updating auto-send setting...',
            success: 'Auto-send is now **{status}**.',
            error: 'Failed to update auto-send setting.',
            noPermission: 'You need Administrator permission to use this command.'
        },
        autosendoptions: {
            noPermission: 'You need Administrator permission to use this command.',
            success: '✅ Auto-send destinations updated.',
            warning: {
                autoSendDisabled: '⚠️ Auto-send is currently **disabled**. Enable it first with `/toggleautosend status:Enable`.'
            },
            error: {
                bothDisabled: '⚠️ You cannot disable both main channel and threads. Keep at least one enabled.',
                general: 'Failed to update auto-send destinations.'
            }
        },
        favgames: {
            noPermission: 'You need Administrator permission to use this command.',
            loading: 'Updating game filter...',
            success: 'Game filter updated.',
            error: 'Failed to update game filter.',
            filterStatus: 'Game filtering: **{status}**',
            gameStatusHeader: 'Enabled Games:',
            allGamesEnabled: 'All games are enabled.'
        },
        help: {
            title: 'HoYo Code Sender Help',
            description: 'Automatically delivers Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero redemption codes to your Discord server.',
            setupHeader: '📌 Quick Setup',
            setupSteps:
                '1. Run `/setup` to choose a notification channel, game roles, and auto-send status.\n' +
                '2. Optional customization:\n' +
                '   • `/livestreamcodesetup` — Set a separate channel for Special Program livestream codes\n' +
                '   • `/setupthread` — Route each game into its own forum thread\n' +
                '   • `/favgames` — Choose which games to receive\n' +
                '   • `/setlang` — Switch language (`English`, `Japanese`, `Vietnamese`)',
            commandsHeader: '📋 Commands',
            commandsList:
                '• `/setup` — Configure main channel, roles, and auto-send\n' +
                '• `/livestreamcodesetup` — Set a separate channel or toggle livestream announcements\n' +
                '• `/setupthread` — Assign forum threads per game\n' +
                '• `/autosendoptions` — Choose main channel, threads, or both\n' +
                '• `/favgames` — Filter which games post to your server\n' +
                '• `/toggleautosend` — Turn automatic delivery on or off\n' +
                '• `/listcodes` — View active codes for a game\n' +
                '• `/postcode` — Post 1–3 codes manually\n' +
                '• `/checkchannels` — Verify bot permissions in your configured channel\n' +
                '• `/demoautosend` — Send a sample notification to test your setup\n' +
                '• `/setlang` — Change server language (`en`, `jp`, `vi`)\n' +
                '• `/deletesetup` — Reset all server settings\n' +
                '• `/dashboard` — Open the web dashboard\n' +
                '• `/vote` — Check Top.gg vote status\n' +
                '• `/about` — Bot version and links\n' +
                '• `/help` — Show this guide',
            tipsHeader: '💡 Notes',
            tipsList:
                '• New codes are checked every 5 minutes and during Special Program livestreams.\n' +
                '• Direct HoYoLAB redemption links pre-fill the code automatically.\n' +
                '• Run `/checkchannels` anytime to verify bot permissions.',
            footer: 'HoYo Code Sender',
            error: 'Could not load help information.'
        },
        about: {
            title: 'About HoYo Code Sender',
            description: 'Discord bot that automatically delivers new Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero redemption codes from HoYoverse.',
            version: 'Version',
            sourceCode: 'Source Code',
            inviteLink: 'Invite Link',
            supportServer: 'Support Server',
            vote: 'Vote on Top.gg',
            github: 'GitHub Repository',
            devbio: 'Developer',
            donate: 'Donate',
            sponsor: 'GitHub Sponsors',
            error: 'Could not load bot information.'
        },
        dashboard: {
            title: '🌐 Web Dashboard',
            description: 'Configure notification channels, forum threads, roles, game filters, and manual code posts from the web dashboard.',
            webInterface: 'Dashboard URL',
            openDashboard: 'Open Dashboard',
            features: 'What You Can Manage',
            featuresList:
                '• 📣 Main and livestream notification channels\n' +
                '• 🧵 Per-game forum threads\n' +
                '• 🎭 Game notification roles\n' +
                '• 🎮 Game filters and server language\n' +
                '• 📝 Manual code posting and channel permission checks',
            requirements: 'Requirements',
            requirementsList:
                '• Sign in with Discord\n' +
                '• Owner, Administrator, or Manage Server / Manage Channels permission\n' +
                '• HoYo Code Sender installed in the server',
            footer: 'HoYo Code Sender Dashboard',
            error: 'Could not load dashboard link.'
        },
        vote: {
            title: 'Vote for HoYo Code Sender',
            description: 'Support HoYo Code Sender by voting on Top.gg.',
            status: 'Vote Status',
            hasVoted: '✅ You voted within the last 12 hours. Thank you!',
            hasNotVoted: '❌ You have not voted in the last 12 hours.',
            link: 'Vote on Top.gg',
            error: 'Could not check vote status.',
            voteAgain: 'You can vote again every 12 hours.',
            thankTitle: 'Thanks for Voting! 🎉',
            thankMessage: 'Thanks for voting for HoYo Code Sender on Top.gg, {user}!',
            dmThankTitle: 'Thanks for Voting!',
            dmThankMessage: 'Thanks for voting for HoYo Code Sender on Top.gg!'
        },
        togglegame: {
            noPermission: 'You need Administrator permission to use this command.',
            loading: 'Updating game notifications...',
            enabledWithNewRole: '✅ **{game}** notifications enabled with role {role}.',
            enabledWithExistingRole: '✅ **{game}** notifications enabled with role {role}.',
            enabledNoRole: '⚠️ **{game}** notifications enabled without a ping role. Run `{command}` to assign a role.',
            disabled: '❌ **{game}** notifications disabled.',
            error: 'Failed to toggle game notifications.'
        },
        sendtothread: {
            noPermission: 'You need Administrator permission to use this command.',
            noActiveCodes: 'No active codes found for {game}.',
            success: '✅ Sent {count} active {game} code(s) to thread "{thread}".',
            instructions: '**How to redeem:**\n1. Open the redemption link above\n2. Sign in to your HoYoverse account\n3. Confirm the code and claim rewards via in-game mail',
            error: {
                notThread: 'The selected channel is not a forum thread.',
                noPermission: 'Missing permission to send messages in that thread.',
                general: 'Failed to send codes to the thread.'
            }
        },
        setupthread: {
            noPermission: 'You need Administrator permission to use this command.',
            success: '✅ Forum threads configured. New codes will be posted to each game\'s dedicated thread.',
            error: {
                notThread: 'One or more selected channels is not a forum thread.',
                noPermission: 'Missing permission to send messages or embed links in one of the selected threads.',
                noSetup: 'Run `/setup` first to configure a main notification channel.',
                general: 'Failed to configure forum threads.'
            }
        },
        livestreamcodesetup: {
            setupRequiredTitle: '⚠️ Setup Required',
            setupRequired: 'Run `/setup` to configure a main notification channel before setting a livestream channel.',
            title: '📺 Livestream Channel Configuration',
            currentSetting: 'Current Channel',
            usingMainChannel: 'Using main channel: {channel}',
            notConfigured: 'Not configured',
            behavior: 'Routing',
            dedicatedBehavior: '✅ Livestream codes are routed to the dedicated livestream channel.',
            mainBehavior: 'ℹ️ Livestream codes are sent to the main notification channel.',
            announcementStatus: 'Special Program Announcements',
            announcementEnabled: '✅ Special Program schedule announcements are enabled.',
            announcementDisabled: '❌ Special Program schedule announcements are disabled.',
            removedTitle: '✅ Livestream Channel Cleared',
            removedDescription: 'Livestream codes will now be posted to your main notification channel.',
            mainChannel: 'Main Channel',
            channelRequiredTitle: '❌ Channel Required',
            channelRequired: 'Select a text or announcement channel when using **Set Channel**.',
            insufficientPermissionsTitle: '⚠️ Missing Permissions',
            insufficientPermissions: 'The bot is missing required permissions in {channel}.',
            requiredPermissions: 'Required Permissions',
            requiredPermissionsValue: '• View Channel\n• Send Messages\n• Embed Links',
            configuredTitle: '✅ Livestream Channel Saved',
            configuredDescription: 'Special Program livestream codes will now be sent to this channel.',
            livestreamCodes: '📺 Livestream Codes',
            regularCodes: '📋 Regular Codes',
            whatHappensNow: '💡 Routing Summary',
            whatHappensNowValue:
                '• Regular codes → Main channel (or game forum threads)\n' +
                '• Livestream codes → Livestream channel\n' +
                '• Special Program announcements → Livestream channel',
            announcementEnabledTitle: '✅ Livestream Announcements Enabled',
            announcementEnabledDescription: 'Upcoming Special Program livestreams will be announced automatically.',
            announcementDisabledTitle: '❌ Livestream Announcements Disabled',
            announcementDisabledDescription: 'Schedule announcements are off. Livestream redemption codes will still be delivered when released.',
            errorTitle: '❌ Error',
            errorDescription: 'Failed to update livestream channel configuration.',
            errorFooter: 'Check bot permissions and try again.'
        }
    },
    livestream: {
        codes: {
            title: '{game} Livestream Codes',
            description: 'Version {version} — {count} code(s) available',
            code: 'Code {number}',
            expires: 'Expires',
            unknownExpiry: 'Unknown',
            redeemHere: 'Redeem Here',
            redeem: 'Click to Redeem'
        },
        announcement: {
            content: '📢 **{game} Livestream Announcement**',
            title: '📺 {game} Special Program Scheduled',
            description: 'The **Version {version}** Special Program livestream has been scheduled.',
            streamTime: '📅 Stream Time',
            estimatedStreamTime: '📅 Estimated Stream Time',
            whatToExpect: '🎁 Overview',
            whatToExpectValue: '• Version update preview\n• Livestream redemption codes\n• New character and event details',
            watchOnYoutube: '▶️ Watch on YouTube',
            status: {
                live: 'LIVE',
                upcoming: 'Upcoming',
                officialChannel: 'Official channel'
            }
        }
    },
    errors: {
        general: 'An error occurred. Please try again.',
        api: 'Could not reach the external API.',
        database: 'A database error occurred.',
        invalidChannel: 'Configured notification channel could not be found.',
        noConfig: 'No notification channel is configured for this server. Run `/setup` first.',
        rateLimit: 'Too many requests. Please wait a moment and try again.',
        dmNotAllowed:
            '❌ `/{command}` can only be used inside a Discord server, not in direct messages.\n\n' +
            'Run this command in a server where HoYo Code Sender is installed.'
    },
    system: {
        startup: 'Starting bot...',
        ready: 'Bot is online.',
        checking: 'Checking for new codes...',
        connected: 'Connected to database.',
        disconnected: 'Disconnected from database.'
    }
};
