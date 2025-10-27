// example.js - Example usage of the Unified OAuth Library

const { UnifiedOAuth } = require('./dist/index.js');

// Initialize the OAuth library with your configurations
const oauth = new UnifiedOAuth({
    google: {
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'profile', 'email']
    },
    github: {
        clientId: 'your-github-client-id',
        clientSecret: 'your-github-client-secret',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['read:user', 'user:email']
    },
    facebook: {
        clientId: 'your-facebook-app-id',
        clientSecret: 'your-facebook-app-secret',
        redirectUri: 'http://localhost:3000/auth/facebook/callback',
        scopes: ['email', 'public_profile']
    }
});

// Example: Express.js route handlers
function setupAuthRoutes(app) {
    // Google OAuth
    app.get('/auth/google', (req, res) => {
        const state = generateRandomState();
        const googleAuth = oauth.getProvider('google');
        const authUrl = googleAuth.getAuthUrl(state);

        // Store state in session for verification
        req.session.oauthState = state;
        res.redirect(authUrl);
    });

    app.get('/auth/google/callback', async (req, res) => {
        const { code, state } = req.query;

        try {
            // Verify state parameter
            if (state !== req.session.oauthState) {
                throw new Error('Invalid state parameter');
            }

            const googleAuth = oauth.getProvider('google');
            const tokenResponse = await googleAuth.getToken(code, state);
            const userProfile = await googleAuth.getUserProfile(tokenResponse.accessToken);

            console.log('Google user authenticated:', userProfile);
            res.json({ success: true, user: userProfile });
        } catch (error) {
            console.error('Google authentication failed:', error);
            res.status(400).json({ error: error.message });
        }
    });

    // GitHub OAuth
    app.get('/auth/github', (req, res) => {
        const state = generateRandomState();
        const githubAuth = oauth.getProvider('github');
        const authUrl = githubAuth.getAuthUrl(state);

        req.session.oauthState = state;
        res.redirect(authUrl);
    });

    app.get('/auth/github/callback', async (req, res) => {
        const { code, state } = req.query;

        try {
            if (state !== req.session.oauthState) {
                throw new Error('Invalid state parameter');
            }

            const githubAuth = oauth.getProvider('github');
            const tokenResponse = await githubAuth.getToken(code, state);
            const userProfile = await githubAuth.getUserProfile(tokenResponse.accessToken);

            console.log('GitHub user authenticated:', userProfile);
            res.json({ success: true, user: userProfile });
        } catch (error) {
            console.error('GitHub authentication failed:', error);
            res.status(400).json({ error: error.message });
        }
    });

    // Facebook OAuth
    app.get('/auth/facebook', (req, res) => {
        const state = generateRandomState();
        const facebookAuth = oauth.getProvider('facebook');
        const authUrl = facebookAuth.getAuthUrl(state);

        req.session.oauthState = state;
        res.redirect(authUrl);
    });

    app.get('/auth/facebook/callback', async (req, res) => {
        const { code, state } = req.query;

        try {
            if (state !== req.session.oauthState) {
                throw new Error('Invalid state parameter');
            }

            const facebookAuth = oauth.getProvider('facebook');
            const tokenResponse = await facebookAuth.getToken(code, state);
            const userProfile = await facebookAuth.getUserProfile(tokenResponse.accessToken);

            console.log('Facebook user authenticated:', userProfile);
            res.json({ success: true, user: userProfile });
        } catch (error) {
            console.error('Facebook authentication failed:', error);
            res.status(400).json({ error: error.message });
        }
    });
}

// Utility function to generate random state
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// Example: Check configured providers
console.log('Configured providers:', oauth.getConfiguredProviders());

// Example: Check if a specific provider is configured
console.log('Google configured:', oauth.isProviderConfigured('google'));
console.log('Twitter configured:', oauth.isProviderConfigured('twitter'));

module.exports = { setupAuthRoutes, oauth };
