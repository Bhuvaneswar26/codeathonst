# Unified OAuth Library

A comprehensive TypeScript library that provides a unified interface for OAuth authentication across multiple popular platforms including Google, Facebook, LinkedIn, Twitter, Instagram, Reddit, and GitHub.

## Features

- **Multi-Provider Support**: Google, Facebook, LinkedIn, Twitter, Instagram, Reddit, and GitHub
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Unified API**: Consistent interface across all OAuth providers
- **Error Handling**: Comprehensive error handling with provider-specific error types
- **Token Management**: Support for access tokens, refresh tokens, and token revocation
- **Configurable**: Easy configuration with redirect URIs and custom scopes
- **Modern**: Built with modern JavaScript/TypeScript features

## Installation

```bash
npm install unified-oauth-lib
```

## Quick Start

```typescript
import { UnifiedOAuth } from "unified-oauth-lib";

// Initialize with your OAuth configurations
const oauth = new UnifiedOAuth({
  google: {
    clientId: "your-google-client-id",
    clientSecret: "your-google-client-secret",
    redirectUri: "http://localhost:3000/auth/google/callback",
    scopes: ["openid", "profile", "email"],
  },
  github: {
    clientId: "your-github-client-id",
    clientSecret: "your-github-client-secret",
    redirectUri: "http://localhost:3000/auth/github/callback",
    scopes: ["read:user", "user:email"],
  },
});

// Get a provider and generate auth URL
const googleAuth = oauth.getProvider("google");
const authUrl = googleAuth.getAuthUrl("random-state-string");

// After user returns with authorization code
const tokenResponse = await googleAuth.getToken(code, state);
const userProfile = await googleAuth.getUserProfile(tokenResponse.accessToken);
```

## Supported Providers

### Google

```typescript
const googleConfig = {
  clientId: "your-google-client-id",
  clientSecret: "your-google-client-secret",
  redirectUri: "http://localhost:3000/auth/google/callback",
  scopes: ["openid", "profile", "email"],
};
```

### Facebook

```typescript
const facebookConfig = {
  clientId: "your-facebook-app-id",
  clientSecret: "your-facebook-app-secret",
  redirectUri: "http://localhost:3000/auth/facebook/callback",
  scopes: ["email", "public_profile"],
};
```

### LinkedIn

```typescript
const linkedinConfig = {
  clientId: "your-linkedin-client-id",
  clientSecret: "your-linkedin-client-secret",
  redirectUri: "http://localhost:3000/auth/linkedin/callback",
  scopes: ["r_liteprofile", "r_emailaddress"],
};
```

### Twitter

```typescript
const twitterConfig = {
  clientId: "your-twitter-client-id",
  clientSecret: "your-twitter-client-secret",
  redirectUri: "http://localhost:3000/auth/twitter/callback",
  scopes: ["tweet.read", "users.read"],
};
```

### Instagram

```typescript
const instagramConfig = {
  clientId: "your-instagram-app-id",
  clientSecret: "your-instagram-app-secret",
  redirectUri: "http://localhost:3000/auth/instagram/callback",
  scopes: ["user_profile", "user_media"],
};
```

### Reddit

```typescript
const redditConfig = {
  clientId: "your-reddit-client-id",
  clientSecret: "your-reddit-client-secret",
  redirectUri: "http://localhost:3000/auth/reddit/callback",
  scopes: ["identity", "read"],
};
```

### GitHub

```typescript
const githubConfig = {
  clientId: "your-github-client-id",
  clientSecret: "your-github-client-secret",
  redirectUri: "http://localhost:3000/auth/github/callback",
  scopes: ["read:user", "user:email"],
};
```

## API Reference

### UnifiedOAuth Class

#### Constructor

```typescript
new UnifiedOAuth(config: UnifiedOAuthConfig)
```

#### Methods

- `getProvider(name: ProviderName): OAuthProvider` - Get a specific OAuth provider
- `getConfiguredProviders(): ProviderName[]` - Get list of configured providers
- `isProviderConfigured(name: ProviderName): boolean` - Check if provider is configured

### OAuthProvider Interface

All providers implement the `OAuthProvider` interface:

#### Methods

- `getAuthUrl(state: string, params?: AuthParams): string` - Generate authorization URL
- `getToken(code: string, state?: string): Promise<TokenResponse>` - Exchange code for token
- `getUserProfile(accessToken: string): Promise<UserProfile>` - Get user profile
- `refreshToken?(refreshToken: string): Promise<TokenResponse>` - Refresh access token (if supported)
- `revokeToken?(accessToken: string): Promise<void>` - Revoke access token (if supported)

### Types

#### UserProfile

```typescript
interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl: string | null;
  username: string | null;
  provider: ProviderName;
  verified?: boolean;
  locale?: string;
  raw: any; // Original provider response
}
```

#### TokenResponse

```typescript
interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType: string;
  expiresIn?: number;
  expiresAt?: Date;
}
```

## Error Handling

The library provides comprehensive error handling with specific error types:

```typescript
import {
  OAuthError,
  TokenError,
  UserProfileError,
  ProviderApiError,
  AuthorizationError,
  StateMismatchError,
  ConfigurationError,
} from "unified-oauth-lib";

try {
  const token = await provider.getToken(code);
} catch (error) {
  if (error instanceof TokenError) {
    console.error("Token exchange failed:", error.message);
    console.error("Provider:", error.provider);
  }
}
```

## Complete Example

```typescript
import { UnifiedOAuth } from "unified-oauth-lib";

const oauth = new UnifiedOAuth({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: "http://localhost:3000/auth/google/callback",
    scopes: ["openid", "profile", "email"],
  },
});

// Express.js example
app.get("/auth/google", (req, res) => {
  const state = generateRandomState();
  const googleAuth = oauth.getProvider("google");
  const authUrl = googleAuth.getAuthUrl(state);

  // Store state in session for verification
  req.session.oauthState = state;
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    // Verify state parameter
    if (state !== req.session.oauthState) {
      throw new Error("Invalid state parameter");
    }

    const googleAuth = oauth.getProvider("google");
    const tokenResponse = await googleAuth.getToken(
      code as string,
      state as string
    );
    const userProfile = await googleAuth.getUserProfile(
      tokenResponse.accessToken
    );

    // Handle successful authentication
    console.log("User authenticated:", userProfile);
    res.json({ success: true, user: userProfile });
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(400).json({ error: error.message });
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
