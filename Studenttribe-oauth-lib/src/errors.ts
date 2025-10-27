// src/errors.ts

import { ProviderName } from "./types";

/**
 * Base error for all errors thrown by this library.
 */
export class OAuthError extends Error {
  public provider: ProviderName;
  public cause: unknown; // Stores the original error

  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message);
    this.name = "OAuthError";
    this.provider = provider;
    this.cause = cause;
  }
}

/**
 * Thrown when exchanging the code for an access token fails.
 */
export class TokenError extends OAuthError {
  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message, provider, cause);
    this.name = "TokenError";
  }
}

/**
 * Thrown when fetching the user's profile fails.
 */
export class UserProfileError extends OAuthError {
  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message, provider, cause);
    this.name = "UserProfileError";
  }
}

/**
 * Thrown when the response from an OAuth provider indicates an error.
 */
export class ProviderApiError extends OAuthError {
  public status: number;
  public responseData: any;

  constructor(
    message: string,
    provider: ProviderName,
    status: number,
    data: any,
    cause?: unknown
  ) {
    super(message, provider, cause);
    this.name = "ProviderApiError";
    this.status = status;
    this.responseData = data;
  }
}

/**
 * Thrown when the authorization code is invalid or expired.
 */
export class AuthorizationError extends OAuthError {
  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message, provider, cause);
    this.name = "AuthorizationError";
  }
}

/**
 * Thrown when the state parameter doesn't match (CSRF protection).
 */
export class StateMismatchError extends OAuthError {
  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message, provider, cause);
    this.name = "StateMismatchError";
  }
}

/**
 * Thrown when a required configuration is missing.
 */
export class ConfigurationError extends OAuthError {
  constructor(message: string, provider: ProviderName, cause?: unknown) {
    super(message, provider, cause);
    this.name = "ConfigurationError";
  }
}
