# HoYo Code Sender Dashboard

A modern Next.js dashboard for displaying HoYoverse game redemption codes, designed to complement the HoYo Code Sender Discord bot.

## Features

- 🎮 **Multi-Game Support**: Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔄 **Auto-Refresh**: Codes are automatically updated every 5 minutes
- 📋 **One-Click Copy**: Copy codes to clipboard with a single click
- 🌙 **Dark Mode**: Automatic dark/light mode based on system preference
- ⚡ **Fast Loading**: Built with Next.js 15 and optimized for performance
- 🎨 **Modern UI**: Built with Tailwind CSS v4

## Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Deployment**: Optimized for Vercel
- **API**: External HoYo Codes API integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chiraitori/Hoyo-code-sender-dashboard.git
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to configure your deployment.

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your GitHub repository
4. Configure the following settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `dashboard` (if deploying from a monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Environment Variables

No environment variables are required for basic functionality. The dashboard uses public APIs for fetching code data.

## Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── codes/          # API routes for fetching game codes
│   │   ├── globals.css         # Global styles with Tailwind CSS v4
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Home page
│   └── components/
│       ├── Footer.tsx          # Site footer
│       ├── GameCodeCard.tsx    # Individual game code display
│       ├── GameCodesGrid.tsx   # Main grid of game codes
│       ├── Header.tsx          # Site navigation
│       └── LoadingSpinner.tsx  # Loading indicator
├── public/                     # Static assets
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## API Routes

### GET /api/codes
Returns codes for all supported games.

**Response:**
```json
{
  "games": [
    {
      "game": "genshin",
      "codes": [
        {
          "code": "GENSHINGIFT",
          "isExpired": false,
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 1,
      "active": 1,
      "expired": 0
    }
  ],
  "summary": {
    "totalCodes": 1,
    "totalActive": 1,
    "totalExpired": 0
  },
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

### GET /api/codes/[game]
Returns codes for a specific game (`genshin`, `hsr`, or `zzz`).

**Response:**
```json
{
  "game": "genshin",
  "codes": [
    {
      "code": "GENSHINGIFT",
      "isExpired": false,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00Z",
  "total": 1,
  "active": 1,
  "expired": 0
}
```

## Customization

### Adding New Games

1. Update the `games` array in `src/components/GameCodesGrid.tsx`
2. Add game mapping in `src/app/api/codes/[game]/route.ts`
3. Add color theme in `src/app/globals.css` and `src/components/GameCodeCard.tsx`

### Styling

The dashboard uses Tailwind CSS v4 with custom color variables. Modify the theme in `src/app/globals.css`:

```css
@theme inline {
  --color-genshin: #5a9fd4;
  --color-hsr: #d4af37;
  --color-zzz: #ff6b35;
  /* Add your custom colors */
}
```

## Performance

- **Caching**: API responses are cached for 5 minutes
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Built-in Next.js image optimization
- **Tree Shaking**: Unused code is automatically removed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- Discord: [Your Support Server](https://discord.gg/your-server)
- GitHub Issues: [Report a Bug](https://github.com/your-repo/issues)

## Related Projects

- [HoYo Code Sender Bot](../README.md) - The main Discord bot
- [HoYo Codes API](https://hoyo-codes.seria.moe) - External API for code data

---

**Note**: This dashboard is not affiliated with HoYoverse. All game names and trademarks belong to their respective owners.
