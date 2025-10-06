# HoYo Code Sender Discord Bot

A Discord bot that automatically fetches and sends redemption codes for HoYoverse games like **Genshin Impact**, **Honkai: Star Rail**, and **Zenless Zone Zero**. This bot allows users to receive the latest game codes directly in their Discord servers. [Invite the bot here](https://discord.com/oauth2/authorize?client_id=1124167011585511516&permissions=2147765312&integration_type=0&scope=bot+applications.commands) | [Bot website](https://hoyo-code.chiraitori.me) | [Documentation](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot/wiki) | [💖 Donate](#-support-the-project)

> **Special Thanks**: This bot uses the [HoYo Codes API](https://github.com/seriaati/hoyo-codes) by [@seria](https://github.com/seriaati) for fetching game codes. Thank you for providing this amazing service! 🙏

![Discord Bots](https://top.gg/api/widget/1124167011585511516.svg)


## Features

- **Automatic Code Detection**: Checks for new redemption codes every 5 minutes.
- **Forum Thread Support**: Configure dedicated permanent threads for each game in forum channels.
- **Flexible Code Delivery**: Send codes to main channel, forum threads, or both.
- **Manual Code Listing**: Use `/listcodes` command to view all active codes for a specific game.
- **Code Redemption Links**: Provides direct links to redeem codes on the official websites.
- **Role-based Notifications**: Mentions specific roles when new codes are available.
- **Customizable Setup**: Configure notification channels, threads, and roles per server.
- **Admin Controls**: Toggle auto-send feature and manually send codes.
- **Multi-language Support**: Available in English, Japanese, and Vietnamese.
- **Game Emojis**: Custom Discord emojis for each supported game for better visual appeal.
- **Smart DM Handling**: Server-only commands automatically inform users when used incorrectly in DMs.
- **Error Handling**: Improved error handling for API calls and interactions.

## Commands

**🏠 Server-Only Commands** (must be used in Discord servers, not DMs):
- `/setup` - Configure notification channels and roles (**Admin only**).
- `/setupthread` - Configure dedicated forum threads for each game with optional role overrides (**Admin only**).
- `/postcode` - Manually post redemption codes with custom messages (**Admin only**).
- `/demoautosend` - Send demo codes to test the notification system (**Admin only**).
- `/toggleautosend` - Enable or disable automatic code notifications (**Admin only**).
- `/autosendoptions` - Configure where codes are sent (main channel and/or forum threads) (**Admin only**).
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

### Setup Thread Command (Forum Threads)

Use the `/setupthread` command to configure dedicated permanent forum threads for each game:

**Required Options:**

- `genshin_thread` - Forum thread for Genshin Impact codes (must be a permanent thread).
- `hsr_thread` - Forum thread for Honkai: Star Rail codes (must be a permanent thread).
- `zzz_thread` - Forum thread for Zenless Zone Zero codes (must be a permanent thread).

**Optional Options (Role Overrides):**

- `genshin_role` - Override the role to mention for Genshin Impact (optional).
- `hsr_role` - Override the role to mention for Honkai: Star Rail (optional).
- `zzz_role` - Override the role to mention for Zenless Zone Zero (optional).

**Features:**
- Creates dedicated permanent threads for each game in a forum channel
- Automatically enables auto-send and thread posting when configured
- Can be used independently from `/setup` command
- Optionally override roles without affecting main channel setup

**Note:** The threads must be **permanent threads** in a **forum channel**. Auto-send will post codes to both the main channel (if configured) and the dedicated forum threads.

### Auto-send Options

Use the `/autosendoptions` command to control where codes are sent:

**Options:**

- `destination` - Choose where to send codes:
  - `both` - Send to both main channel and forum threads (default)
  - `channel_only` - Send only to main channel
  - `threads_only` - Send only to forum threads

This allows you to customize code delivery based on your server's needs.

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

## 💖 Support the Project

If you find this bot useful and want to support its development and maintenance, you can donate through various platforms:

### International Donations

[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/chiraitori)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/chiraitori)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal)](https://paypal.me/chiraitori)

- **GitHub Sponsors**: [github.com/sponsors/chiraitori](https://github.com/sponsors/chiraitori) ⭐ **RECOMMENDED**
  - **Fee**: GitHub takes **0% fee**, you keep 100% ✅
  - Supports monthly recurring donations and one-time contributions
  - **Best option for maximizing your donation impact!**
  
- **Ko-fi**: [ko-fi.com/chiraitori](https://ko-fi.com/chiraitori)
  - **Fee**: Ko-fi **0% platform fee**, but processes through **PayPal** (PayPal fees ~2.9% + $0.30 apply) 💳
  - One-time or membership support
  
- **PayPal**: [paypal.me/chiraitori](https://paypal.me/chiraitori)
  - **Fee**: PayPal takes **2.9% + $0.30 USD** per transaction ⚠️
  - For international donations: additional **currency conversion fee (~3-4%)**
  - Direct PayPal transfer option

### 🎮 CS2 Skin Trading

Got some Counter-Strike 2 skins you don't need? Trade them for bot support! 😄

- **Steam Trade**: Send me a trade offer for CS2 skins
- **Contact**: Reach out via Discord or GitHub to discuss the trade
- **How it works**: 
  - You send CS2 skins → I sell them → Revenue goes to bot development
  - Any skin value welcome (even cheap ones help!)
  - Fun way to support if you're a CS2 player! 🔫

**Note**: This is a casual option for gamers who want to support in a unique way!

### Vietnamese Banking (Việt Nam)

For Vietnamese users, you can donate via bank transfer or PayOS:

#### 🏦 Bank Transfer (QR Code - No Fees)
- **Website**: [chiraitori.io.vn](https://chiraitori.io.vn) - Scrow Down You Will See The **QR** Section
- **Bank**: MB Bank (Ngân hàng TMCP Quân Đội)
- **Account Number**: `19071945512011`
- **Account Name**: `NGUYEN TAN TU`
- **Transfer Content**: `HoYo Code Bot - [Your Discord Username]` (optional)
- **Note**: Direct bank transfer via QR code has **NO FEES** ✅

#### 💳 PayOS (Convenient Payment - Has Fees)
- **Website**: [chiraitori.io.vn](https://chiraitori.io.vn) - Scrow Down You Will See The **"PayOS"** Section
- **Supported**: ATM cards, credit cards, e-wallets (MoMo, ZaloPay, etc.)
- **Note**: PayOS charges a small transaction fee (~2-3%) ⚠️

### Why Donate?

Your donations help:
- 💰 Cover server hosting costs
- ⚡ Maintain fast and reliable bot performance
- 🆕 Develop new features and improvements
- 🐛 Fix bugs and provide support
- 📚 Keep the documentation updated

Every donation, no matter how small, is greatly appreciated and helps keep this project running! 🙏

### 💝 Free Ways to Support

Love the project but don't have money to donate? No worries! Here are free ways to show your support:

- ⭐ **Star this repository on GitHub** - It helps the project gain visibility and motivates development!
  - Click the ⭐ Star button at the top of this page
  - Takes 2 seconds, means a lot! 🌟
  
- 🗳️ **Vote on Top.gg** - Support the bot for free by voting!
  - Use the `/vote` command in Discord to get the voting link
  - You can vote every 12 hours
  
- 📢 **Share the bot** - Tell your friends and gaming communities!
  - Invite the bot to more servers
  - Share on Discord, Reddit, or social media
  
- 🐛 **Report bugs or suggest features** - Help improve the bot!
  - Open issues on GitHub
  - Your feedback is valuable!

**Every star, vote, and share helps keep this project alive!** ❤️

## Thank You
- Special thanks to [@seria](https://github.com/seriaati) for the [HoYo Codes API](https://github.com/seriaati/hoyo-codes)
