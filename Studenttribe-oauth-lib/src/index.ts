// src/index.ts

// Re-export all your types for the end-user
export * from "./types";
export * from "./errors";

// Import your provider classes
import { GitHubProvider } from "./provider/github";
import { GoogleProvider } from "./provider/google";
import { FacebookProvider } from "./provider/facebook";
import { LinkedInProvider } from "./provider/linkedin";
import { TwitterProvider } from "./provider/twitter";
import { InstagramProvider } from "./provider/instagram";
import { RedditProvider } from "./provider/reddit";

import { OAuthProvider, ProviderConfig, ProviderName } from "./types";

/**
 * The main configuration object for the library.
 */
export type UnifiedOAuthConfig = {
  [K in ProviderName]?: ProviderConfig;
};

/**
 * The main class for managing OAuth providers.
 */
export class UnifiedOAuth {
  private providers: Map<ProviderName, OAuthProvider>;

  constructor(config: UnifiedOAuthConfig) {
    this.providers = new Map();

    // Initialize all configured providers
    if (config.google) {
      this.providers.set("google", new GoogleProvider(config.google));
    }
    if (config.facebook) {
      this.providers.set("facebook", new FacebookProvider(config.facebook));
    }
    if (config.linkedin) {
      this.providers.set("linkedin", new LinkedInProvider(config.linkedin));
    }
    if (config.twitter) {
      this.providers.set("twitter", new TwitterProvider(config.twitter));
    }
    if (config.instagram) {
      this.providers.set("instagram", new InstagramProvider(config.instagram));
    }
    if (config.reddit) {
      this.providers.set("reddit", new RedditProvider(config.reddit));
    }
    if (config.github) {
      this.providers.set("github", new GitHubProvider(config.github));
    }
  }

  /**
   * Gets the implementation for a specific provider.
   * @param name - The name of the provider (e.g., 'github', 'google', etc.)
   */
  public getProvider(name: ProviderName): OAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" is not configured or supported.`);
    }
    return provider;
  }

  /**
   * Gets a list of all configured providers.
   */
  public getConfiguredProviders(): ProviderName[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Checks if a provider is configured.
   * @param name - The name of the provider to check
   */
  public isProviderConfigured(name: ProviderName): boolean {
    return this.providers.has(name);
  }
}

// Example of how a user would use your library:
/*
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

// Use any configured provider
const googleAuth = oauth.getProvider('google');
const authUrl = googleAuth.getAuthUrl('random-state-string');
// Redirect user to authUrl

// After user returns with code
const tokenResponse = await googleAuth.getToken(code, state);
const userProfile = await googleAuth.getUserProfile(tokenResponse.accessToken);
*/
