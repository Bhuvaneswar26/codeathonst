# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Configure Environment

```bash
# Copy the environment template
cp env.example .env

# Edit .env and add at least one OAuth provider
# For example, add Google OAuth:
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Start the Application

```bash
npm start
```

### 3. Open Your Browser

Visit: http://localhost:3000

## 🔧 OAuth Provider Setup

### Google (Recommended for testing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://localhost:3000/auth/google/callback`
4. Copy credentials to `.env`

### GitHub (Easy setup)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth app
3. Set callback URL: `http://localhost:3000/auth/github/callback`
4. Copy credentials to `.env`

## 🧪 Test the Library

```bash
node test-oauth.js
```

## 📱 Features Demonstrated

- ✅ Multi-provider OAuth authentication
- ✅ Modern, responsive UI
- ✅ Session management
- ✅ Error handling
- ✅ User profile display
- ✅ Logout functionality
- ✅ Health check API

## 🔍 API Endpoints

- `GET /` - Login page
- `GET /auth/{provider}` - Start OAuth flow
- `GET /auth/{provider}/callback` - OAuth callback
- `GET /success` - Success page
- `GET /api/user` - Get user profile
- `POST /logout` - Logout
- `GET /health` - Health check

## 🐛 Troubleshooting

**Provider not working?**

- Check your `.env` file has correct credentials
- Verify redirect URI matches exactly
- Check provider's developer console for errors

**Session issues?**

- Make sure `SESSION_SECRET` is set in `.env`
- Clear browser cookies and try again

**Need help?**

- Check the main README.md for detailed setup instructions
- Run `node test-oauth.js` to verify library functionality
