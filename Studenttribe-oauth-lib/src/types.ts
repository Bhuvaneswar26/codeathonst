// src/types.ts

/**
 * Supported OAuth providers
 */
export type ProviderName =
  | "google"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "reddit"
  | "github";

/**
 * Base configuration for all OAuth providers
 */
export interface BaseProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * Provider-specific configurations
 */
export interface GoogleProviderConfig extends BaseProviderConfig {
  // Google-specific options can be added here
}

export interface FacebookProviderConfig extends BaseProviderConfig {
  // Facebook-specific options can be added here
}

export interface LinkedInProviderConfig extends BaseProviderConfig {
  // LinkedIn-specific options can be added here
}

export interface TwitterProviderConfig extends BaseProviderConfig {
  // Twitter-specific options can be added here
}

export interface InstagramProviderConfig extends BaseProviderConfig {
  // Instagram-specific options can be added here
}

export interface RedditProviderConfig extends BaseProviderConfig {
  // Reddit-specific options can be added here
}

export interface GitHubProviderConfig extends BaseProviderConfig {
  // GitHub-specific options can be added here
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig =
  | GoogleProviderConfig
  | FacebookProviderConfig
  | LinkedInProviderConfig
  | TwitterProviderConfig
  | InstagramProviderConfig
  | RedditProviderConfig
  | GitHubProviderConfig;

/**
 * The access token response from OAuth providers
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType: string;
  expiresIn?: number;
  expiresAt?: Date;
}

/**
 * A standardized user profile across all providers
 */
export interface UserProfile {
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
  raw: any; // The original, raw user object from the provider
}

/**
 * OAuth authorization parameters
 */
export interface AuthParams {
  state?: string;
  prompt?: string;
  access_type?: string;
  include_granted_scopes?: boolean;
  login_hint?: string;
  hd?: string;
}

/**
 * The main interface for all OAuth providers
 */
export interface OAuthProvider {
  /**
   * Generates the authorization URL to redirect the user to.
   * @param state - An opaque value used to prevent CSRF.
   * @param params - Additional authorization parameters
   */
  getAuthUrl(state: string, params?: AuthParams): string;

  /**
   * Exchanges an authorization code for an access token.
   * @param code - The authorization code from the callback.
   * @param state - The state parameter for verification
   */
  getToken(code: string, state?: string): Promise<TokenResponse>;

  /**
   * Refreshes an access token using a refresh token.
   * @param refreshToken - The refresh token
   */
  refreshToken?(refreshToken: string): Promise<TokenResponse>;

  /**
   * Fetches the user's profile using the access token.
   * @param accessToken - The access token.
   */
  getUserProfile(accessToken: string): Promise<UserProfile>;

  /**
   * Revokes an access token.
   * @param accessToken - The access token to revoke
   */
  revokeToken?(accessToken: string): Promise<void>;
}
