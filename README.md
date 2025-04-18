# HoYo Code Sender Discord Bot

A Discord bot that automatically fetches and sends redemption codes for HoYoverse games like **Genshin Impact**, **Honkai: Star Rail**, and **Zenless Zone Zero**. This bot allows users to receive the latest game codes directly in their Discord servers. [Invite the bot here](https://discord.com/oauth2/authorize?client_id=1124167011585511516&permissions=2147765312&integration_type=0&scope=bot+applications.commands),[Bot website not dashboard](https://hoyo-code.chiraitori.me)




![Discord Bots](https://top.gg/api/widget/1124167011585511516.svg)


## Features

- **Automatic Code Detection**: Checks for new redemption codes every 5 minutes.
- **Manual Code Listing**: Use `/listcodes` command to view all active codes for a specific game.
- **Code Redemption Links**: Provides direct links to redeem codes on the official websites.
- **Role-based Notifications**: Mentions specific roles when new codes are available.
- **Customizable Setup**: Configure notification channels and roles per server.
- **Admin Controls**: Toggle auto-send feature and manually send codes.
- **Error Handling**: Improved error handling for API calls and interactions.

## Commands

- `/setup` - Configure notification channels and roles (**Admin only**).
- `/listcodes` - List all active codes for a selected game.
- `/redeem` - Manually send redemption codes with custom messages (**Admin only**).
- `/toggleautosend` - Enable or disable automatic code notifications (**Admin only**).
- `/setlang` - To set the language to the bot now only have en,vi,jp (**Admin Only**).
- `/vote` - To vote the bot on top.gg. (You can delete this command if you self hosting).

## Setup

### Prerequisites

- **Node.js** (version 16.9.0 or higher)
- **npm**
- **Discord Bot Token**
- **MongoDB Database**

### Installation

1. **Clone the repository**:
```bash
   git clone https://github.com/yourusername/hoyoverse-code-bot.git
   cd hoyoverse-code-bot
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
Replace your_discord_bot_token, your_mongodb_connection_string, and your_discord_client_id with your actual credentials.
 4. **Run the bot:**
 ```bash
 node index.js
 ```

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
**Options:**

- `game` - Select the game (`genshin`, `hsr`, or `zzz`).

### Redeeming Codes
- **Game selection**
- **Up to three codes**
- **An optional message**
Redeeming Codes
### Toggle Auto-send

Admins can enable or disable the automatic code sending feature using the `/toggleautosend` command:
**Options:**

- `status` - Choose `enable` or `disable`.

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
This project is for educational purposes. All game names and related content belong to HoYoverse. 

## Thank You
- Thank [@seria](https://github.com/seriaati) for the code games Api
