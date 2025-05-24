# Deployment Guide

This guide covers important considerations when deploying the HoYo Code Sender Discord Bot to production environments.

## Environment Variables

Create a `.env` file with the following required variables:

```env
DISCORD_TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
CLIENT_ID=your_discord_client_id
OWNER_ID=your_discord_user_id
PORT=3000
VERSION=1.0.0
```

## Reverse Proxy Configuration

If you're deploying behind a reverse proxy (nginx, Apache, CloudFlare, etc.), the bot is configured to handle `X-Forwarded-For` headers correctly.

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The bot automatically trusts proxy headers when deployed, ensuring rate limiting works correctly.

## Docker Deployment

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  hoyo-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - MONGODB_URI=${MONGODB_URI}
      - CLIENT_ID=${CLIENT_ID}
      - OWNER_ID=${OWNER_ID}
    restart: unless-stopped
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

Run with:
```bash
docker-compose up -d
```

### Single Container

```bash
docker build -t hoyo-bot .
docker run -d \
  --name hoyo-bot \
  -p 3000:3000 \
  -e DISCORD_TOKEN=your_token \
  -e MONGODB_URI=your_mongo_uri \
  -e CLIENT_ID=your_client_id \
  -e OWNER_ID=your_owner_id \
  hoyo-bot
```

## PM2 Process Management

For production deployment with PM2:

```bash
npm install -g pm2
npm run pm2
```

Or create a custom ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'hoyo-code-sender',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## Security Considerations

### Rate Limiting
- Global rate limit: 100 requests per 15 minutes
- API rate limit: 30 requests per 5 minutes
- Automatic IP detection through proxy headers

### Environment Security
- Never commit `.env` files to version control
- Use secure MongoDB connections (MongoDB Atlas recommended)
- Regularly rotate Discord bot tokens
- Keep dependencies updated

### MongoDB Security
- Use MongoDB Atlas or secure self-hosted instance
- Enable authentication
- Use connection strings with authentication
- Regular backups

## Monitoring

### Health Checks
The bot provides basic health monitoring through:
- Console logging of major events
- Error tracking and recovery
- MongoDB connection monitoring

### Recommended Monitoring Tools
- **PM2 Monitoring**: Built-in process monitoring
- **MongoDB Compass**: Database monitoring
- **Discord Developer Portal**: Bot statistics

## Troubleshooting

### Common Issues

#### Rate Limit Errors
If you see `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`:
- This is automatically handled in the latest version
- The bot sets `trust proxy` to true when behind reverse proxies

#### MongoDB Connection Issues
- Verify connection string format
- Check network connectivity
- Ensure MongoDB service is running
- Verify authentication credentials

#### Discord API Issues
- Check bot token validity
- Verify bot permissions in Discord Developer Portal
- Ensure bot is invited to guilds with correct permissions

### Logs
Monitor logs for:
- Database connection status
- Code fetching errors
- Discord API rate limits
- Command execution errors

## Performance Optimization

### Database Optimization
- Use MongoDB indexes for frequently queried fields
- Regular database maintenance
- Connection pooling (handled by Mongoose)

### Memory Management
- Monitor memory usage with PM2
- Regular restarts if memory leaks occur
- Optimize database queries

### Scaling
- Consider horizontal scaling for high-traffic deployments
- Use load balancers for multiple instances
- Database clustering for high availability

## Support

For deployment issues:
1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Test connectivity to external services (Discord API, MongoDB)
4. Join our [Discord support server](https://dsc.gg/chiraitori-support) for help
