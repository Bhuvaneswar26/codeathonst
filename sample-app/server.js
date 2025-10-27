const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import our unified OAuth library
const { UnifiedOAuth } = require('studenttribe-oauth-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize OAuth with multiple providers
const kkkkkkkk = new UnifiedOAuth({
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback',
        scopes: ['openid', 'profile', 'email']
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/auth/github/callback',
        scopes: ['read:user', 'user:email']
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
        scopes: ['email', 'public_profile']
    },
    linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback',
        scopes: ['r_liteprofile', 'r_emailaddress']
    },
    twitter: {
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3001/auth/twitter/callback',
        scopes: ['tweet.read', 'users.read']
    },
    instagram: {
        clientId: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback',
        scopes: ['user_profile', 'user_media']
    },
    reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        redirectUri: process.env.REDDIT_REDIRECT_URI || 'http://localhost:3001/auth/reddit/callback',
        scopes: ['identity', 'read']
    }
});

// Utility function to generate random state
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// OAuth provider routes
const providers = ['google', 'github', 'facebook', 'linkedin', 'twitter', 'instagram', 'reddit'];

providers.forEach(provider => {
    // Initiate OAuth flow
    app.get(`/auth/${provider}`, (req, res) => {
        try {
            if (!oauth.isProviderConfigured(provider)) {
                return res.status(400).json({
                    error: `${provider} provider is not configured. Please check your environment variables.`
                });
            }

            const state = generateRandomState();
            const providerAuth = oauth.getProvider(provider);
            const authUrl = providerAuth.getAuthUrl(state);

            // Store state in session for verification
            req.session.oauthState = state;
            req.session.provider = provider;

            console.log(`Redirecting to ${provider} OAuth:`, authUrl);
            res.redirect(authUrl);
        } catch (error) {
            console.error(`Error initiating ${provider} OAuth:`, error);
            res.status(500).json({ error: `Failed to initiate ${provider} authentication` });
        }
    });

    // OAuth callback
    app.get(`/auth/${provider}/callback`, async (req, res) => {
        try {
            const { code, state, error } = req.query;

            // Check for OAuth errors
            if (error) {
                console.error(`${provider} OAuth error:`, error);
                return res.status(400).json({
                    error: `OAuth error from ${provider}: ${error}`
                });
            }

            // Verify state parameter
            if (!state || state !== req.session.oauthState) {
                console.error('State mismatch for', provider);
                return res.status(400).json({
                    error: 'Invalid state parameter. Possible CSRF attack.'
                });
            }

            if (!code) {
                return res.status(400).json({
                    error: 'Authorization code not provided'
                });
            }

            const providerAuth = oauth.getProvider(provider);

            // Exchange code for token
            const tokenResponse = await providerAuth.getToken(code, state);
            console.log(`${provider} token response:`, {
                accessToken: tokenResponse.accessToken ? '***' : 'none',
                tokenType: tokenResponse.tokenType,
                expiresIn: tokenResponse.expiresIn
            });

            // Get user profile
            const userProfile = await providerAuth.getUserProfile(tokenResponse.accessToken);
            console.log(`${provider} user profile:`, {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                provider: userProfile.provider
            });

            // Store user data in session
            req.session.user = {
                ...userProfile,
                accessToken: tokenResponse.accessToken,
                refreshToken: tokenResponse.refreshToken,
                expiresAt: tokenResponse.expiresAt
            };

            // Clear OAuth state
            delete req.session.oauthState;
            delete req.session.provider;

            // Redirect to success page
            res.redirect('/success');
        } catch (error) {
            console.error(`Error in ${provider} callback:`, error);
            res.status(500).json({
                error: `Authentication failed with ${provider}: ${error.message}`
            });
        }
    });
});

// Success page
app.get('/success', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// User profile API
app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Don't send sensitive data
    const { accessToken, refreshToken, ...userProfile } = req.session.user;
    res.json(userProfile);
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Health check
app.get('/health', (req, res) => {
    const configuredProviders = oauth.getConfiguredProviders();
    res.json({
        status: 'OK',
        configuredProviders,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 OAuth Sample App running on http://localhost:${PORT}`);
    console.log(`📋 Configured providers: ${oauth.getConfiguredProviders().join(', ')}`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});
