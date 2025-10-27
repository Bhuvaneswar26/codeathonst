/**
 * Supported OAuth providers
 */
type ProviderName = "google" | "facebook" | "linkedin" | "twitter" | "instagram" | "reddit" | "github";
/**
 * Base configuration for all OAuth providers
 */
interface BaseProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}
/**
 * Provider-specific configurations
 */
interface GoogleProviderConfig extends BaseProviderConfig {
}
interface FacebookProviderConfig extends BaseProviderConfig {
}
interface LinkedInProviderConfig extends BaseProviderConfig {
}
interface TwitterProviderConfig extends BaseProviderConfig {
}
interface InstagramProviderConfig extends BaseProviderConfig {
}
interface RedditProviderConfig extends BaseProviderConfig {
}
interface GitHubProviderConfig extends BaseProviderConfig {
}
/**
 * Union type for all provider configurations
 */
type ProviderConfig = GoogleProviderConfig | FacebookProviderConfig | LinkedInProviderConfig | TwitterProviderConfig | InstagramProviderConfig | RedditProviderConfig | GitHubProviderConfig;
/**
 * The access token response from OAuth providers
 */
interface TokenResponse {
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
    raw: any;
}
/**
 * OAuth authorization parameters
 */
interface AuthParams {
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
interface OAuthProvider {
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

/**
 * Base error for all errors thrown by this library.
 */
declare class OAuthError extends Error {
    provider: ProviderName;
    cause: unknown;
    constructor(message: string, provider: ProviderName, cause?: unknown);
}
/**
 * Thrown when exchanging the code for an access token fails.
 */
declare class TokenError extends OAuthError {
    constructor(message: string, provider: ProviderName, cause?: unknown);
}
/**
 * Thrown when fetching the user's profile fails.
 */
declare class UserProfileError extends OAuthError {
    constructor(message: string, provider: ProviderName, cause?: unknown);
}
/**
 * Thrown when the response from an OAuth provider indicates an error.
 */
declare class ProviderApiError extends OAuthError {
    status: number;
    responseData: any;
    constructor(message: string, provider: ProviderName, status: number, data: any, cause?: unknown);
}
/**
 * Thrown when the authorization code is invalid or expired.
 */
declare class AuthorizationError extends OAuthError {
    constructor(message: string, provider: ProviderName, cause?: unknown);
}
/**
 * Thrown when the state parameter doesn't match (CSRF protection).
 */
declare class StateMismatchError extends OAuthError {
    constructor(message: string, provider: ProviderName, cause?: unknown);
}
/**
 * Thrown when a required configuration is missing.
 */
declare class ConfigurationError extends OAuthError {
    constructor(message: string, provider: ProviderName, cause?: unknown);
}

/**
 * The main configuration object for the library.
 */
type UnifiedOAuthConfig = {
    [K in ProviderName]?: ProviderConfig;
};
/**
 * The main class for managing OAuth providers.
 */
declare class UnifiedOAuth {
    private providers;
    constructor(config: UnifiedOAuthConfig);
    /**
     * Gets the implementation for a specific provider.
     * @param name - The name of the provider (e.g., 'github', 'google', etc.)
     */
    getProvider(name: ProviderName): OAuthProvider;
    /**
     * Gets a list of all configured providers.
     */
    getConfiguredProviders(): ProviderName[];
    /**
     * Checks if a provider is configured.
     * @param name - The name of the provider to check
     */
    isProviderConfigured(name: ProviderName): boolean;
}

export { type AuthParams, AuthorizationError, type BaseProviderConfig, ConfigurationError, type FacebookProviderConfig, type GitHubProviderConfig, type GoogleProviderConfig, type InstagramProviderConfig, type LinkedInProviderConfig, OAuthError, type OAuthProvider, ProviderApiError, type ProviderConfig, type ProviderName, type RedditProviderConfig, StateMismatchError, TokenError, type TokenResponse, type TwitterProviderConfig, UnifiedOAuth, type UnifiedOAuthConfig, type UserProfile, UserProfileError };
