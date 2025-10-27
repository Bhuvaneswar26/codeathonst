# OAuth Sample Application

A complete Express.js application demonstrating how to use the `unified-oauth-lib` library for authentication with multiple OAuth providers.

## Features

- **Multi-Provider Support**: Google, GitHub, Facebook, LinkedIn, Twitter, Instagram, and Reddit
- **Modern UI**: Clean, responsive interface with provider-specific styling
- **Session Management**: Secure session handling with Express Session
- **Error Handling**: Comprehensive error handling and user feedback
- **Health Check**: API endpoint to check server status and configured providers
- **Real-time Updates**: Dynamic user profile display

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your OAuth credentials:

```bash
cp env.example .env
```

Edit `.env` and add your OAuth app credentials for the providers you want to test.

### 3. Start the Application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Client Secret to your `.env` file

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/auth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

### LinkedIn OAuth Setup

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add Sign In with LinkedIn product
4. Set Authorized redirect URLs: `http://localhost:3000/auth/linkedin/callback`
5. Copy Client ID and Client Secret to your `.env` file

### Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Set Callback URL: `http://localhost:3000/auth/twitter/callback`
5. Copy Client ID and Client Secret to your `.env` file

### Instagram OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/auth/instagram/callback`
5. Copy App ID and App Secret to your `.env` file

### Reddit OAuth Setup

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Create a new app (script type)
3. Set redirect URI: `http://localhost:3000/auth/reddit/callback`
4. Copy Client ID and Client Secret to your `.env` file

## API Endpoints

### Authentication Routes

- `GET /auth/{provider}` - Initiate OAuth flow for specific provider
- `GET /auth/{provider}/callback` - Handle OAuth callback

### User Routes

- `GET /api/user` - Get current user profile (requires authentication)
- `POST /logout` - Logout current user

### Utility Routes

- `GET /health` - Health check and configured providers list
- `GET /` - Login page
- `GET /success` - Success page (requires authentication)

## Project Structure

```
sample-app/
├── public/
│   ├── index.html          # Login page
│   └── success.html        # Success page
├── server.js               # Main Express server
├── package.json            # Dependencies and scripts
├── env.example             # Environment variables template
└── README.md              # This file
```

## Usage Examples

### Basic Authentication Flow

1. User visits the home page
2. Clicks on a provider button (e.g., Google)
3. Gets redirected to the OAuth provider
4. User authorizes the application
5. Gets redirected back to `/auth/google/callback`
6. Server exchanges code for access token
7. Server fetches user profile
8. User gets redirected to success page

### Programmatic Usage

```javascript
// Check if user is authenticated
fetch("/api/user")
  .then((response) => response.json())
  .then((user) => {
    console.log("User:", user);
  });

// Logout user
fetch("/logout", { method: "POST" }).then(() => {
  console.log("Logged out");
});
```

## Error Handling

The application includes comprehensive error handling:

- **OAuth Errors**: Provider-specific error messages
- **State Mismatch**: CSRF protection
- **Network Errors**: Graceful fallbacks
- **Session Errors**: Proper cleanup

## Security Considerations

- **State Parameter**: CSRF protection using random state values
- **Session Security**: Secure session configuration
- **Environment Variables**: Sensitive data stored in environment variables
- **HTTPS**: Use HTTPS in production

## Development

### Adding New Providers

1. Add provider configuration to `server.js`
2. Add provider button to `index.html`
3. Add provider styling to CSS
4. Test the integration

### Customizing UI

- Modify `public/index.html` for login page
- Modify `public/success.html` for success page
- Update CSS styles as needed

## Troubleshooting

### Common Issues

1. **Provider not configured**: Check your `.env` file
2. **Redirect URI mismatch**: Ensure callback URLs match exactly
3. **CORS issues**: Check your server configuration
4. **Session issues**: Verify session secret is set

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use HTTPS for all OAuth callbacks
3. Set secure session configuration
4. Use environment variables for all secrets
5. Configure proper CORS settings

## License

MIT
