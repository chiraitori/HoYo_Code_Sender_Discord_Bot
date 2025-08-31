# HoYo Code Sender Discord Bot

A Discord bot that automatically fetches and sends redemption codes for HoYoverse games like **Genshin Impact**, **Honkai: Star Rail**, and **Zenless Zone Zero**. This bot allows users to receive the latest game codes directly in their Discord servers. [Invite the bot here](https://discord.com/oauth2/authorize?client_id=1124167011585511516&permissions=2147765312&integration_type=0&scope=bot+applications.commands) | [Bot website](https://hoyo-code.chiraitori.me) | [Documentation](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot/wiki)


![Discord Bots](https://top.gg/api/widget/1124167011585511516.svg)


## Features

- **Automatic Code Detection**: Checks for new redemption codes every 5 minutes.
- **Manual Code Listing**: Use `/listcodes` command to view all active codes for a specific game.
- **Code Redemption Links**: Provides direct links to redeem codes on the official websites.
- **Role-based Notifications**: Mentions specific roles when new codes are available.
- **Customizable Setup**: Configure notification channels and roles per server.
- **Admin Controls**: Toggle auto-send feature and manually send codes.
- **Multi-language Support**: Available in English, Japanese, and Vietnamese.
- **Game Emojis**: Custom Discord emojis for each supported game for better visual appeal.
- **Smart DM Handling**: Server-only commands automatically inform users when used incorrectly in DMs.
- **Error Handling**: Improved error handling for API calls and interactions.

## Commands

**🏠 Server-Only Commands** (must be used in Discord servers, not DMs):
- `/setup` - Configure notification channels and roles (**Admin only**).
- `/postcode` - Manually post redemption codes with custom messages (**Admin only**).
- `/demoautosend` - Send demo codes to test the notification system (**Admin only**).
- `/toggleautosend` - Enable or disable automatic code notifications (**Admin only**).
- `/favgames` - Set which game codes you want to receive (**Admin only**).
- `/setlang` - Set the bot language for this server (English/Vietnamese/Japanese) (**Admin only**).
- `/checkchannels` - Check and validate notification channels (**Admin only**).
- `/deletesetup` - Delete all bot configuration for this server (**Admin only**).

**📱 Universal Commands** (work in both servers and DMs):
- `/listcodes` - List all active codes for a selected game.
- `/help` - Shows how to setup the bot and provides usage tips.
- `/about` - Show information about the bot.
- `/vote` - Get information about voting for the bot on Top.gg.

## Setup

### Prerequisites

- **Node.js** (version 20.1.0 or higher)
- **npm**
- **Discord Bot Token**
- **MongoDB Database**

### Installation

1. **Clone the repository**:
```bash
   git clone https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot.git
   cd HoYo_Code_Sender_Discord_Bot
```
2. **Install dependencies:**
```bash
   npm install
```
3. **Configure environment variables:**
Create a .env file in the root directory and add the following:
```env
   DISCORD_TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_ID=your_discord_client_id
   OWNER_ID=your_id_in_discord
```
Replace your_discord_bot_token, your_mongodb_connection_string, and your_discord_client_id with your actual credentials. 4. **Run the bot:**
 ```bash
 node index.js
 ```

For production deployment, see the [Deployment Guide](DEPLOYMENT.md) for detailed instructions including Docker, PM2, and reverse proxy configuration.

 ## Usage

 ### Setup Command

 Use the `/setup` command to configure the notification roles and channels:

**Options:**

- `genshin_role` - Role to mention for Genshin Impact codes.
- `hsr_role` - Role to mention for Honkai: Star Rail codes.
- `zzz_role` - Role to mention for Zenless Zone Zero codes.
- `channel` - Channel where the codes will be sent.

### To Do

- [X] Add language file and command changer
- [X] Add translate dictionary to full translate the api to some language (35% complete)

### Listing Codes

Use the `/listcodes` command to view all active redemption codes:

**Options:**

- `game` - Select the game (`genshin`, `hsr`, or `zzz`).

### Posting Custom Codes

Use the `/postcode` command to manually post redemption codes with custom messages (**Admin only**):

**Features:**
- **Game selection** - Choose which game the codes are for
- **Up to three codes** - Post multiple codes at once
- **Custom message** - Add your own message with the codes
- **Automatic role mentions** - Mentions the appropriate game role
### Toggle Auto-send

Admins can enable or disable the automatic code sending feature using the `/toggleautosend` command:

**Options:**

- `status` - Choose `enable` or `disable`.

### DM Usage

The bot supports two types of commands:

**🏠 Server-Only Commands:** These commands require server context and will show a helpful error message if used in DMs:
- All admin commands (`/setup`, `/postcode`, `/toggleautosend`, etc.)
- Server configuration commands (`/setlang`, `/favgames`, etc.)

**📱 Universal Commands:** These work anywhere and can be used in both servers and DMs:
- `/listcodes` - View active codes
- `/help` - Get help information  
- `/about` - Bot information
- `/vote` - Voting information

When a server-only command is used in DMs, the bot will respond with a clear explanation and guide users to use the command in a proper server.

### Error Handling
- Try-catch blocks around API calls.
- User-friendly error messages.
- Logging of errors for debugging purposes.

### API Integration

Uses the [HoYo Codes API](https://github.com/seriaati/hoyo-codes) to fetch the latest redemption codes for:
- **Genshin Impact**
- **Honkai: Star Rail**
- **Zenless Zone Zero**

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security
For information about reporting security vulnerabilities, please read our [Security Policy](SECURITY.md).

The bot implements several security measures:
- **Rate Limiting**: API endpoints are protected against DoS attacks with request limits
- **Input Validation**: All user inputs are validated before processing
- **Permission Controls**: Command access is restricted based on user roles
- **Context Validation**: Server-only commands are blocked in DMs with helpful error messages
- **Secure Data Storage**: Sensitive data is stored securely using environment variables

## Disclaimer
**This bot is NOT affiliated with, endorsed by, or connected to HoYoverse (miHoYo) in any way.** This is a fan-made tool created to help the community. All game names, logos, and related content are trademarks and copyrights of HoYoverse (miHoYo).

## Thank You
- Thank [@seria](https://github.com/seriaati) for the code games API
## Made by 
![https://enka.network/u/802228840/](https://raw.githubusercontent.com/heartlog/Hoyocodes/refs/heads/main/assets/card.png)
