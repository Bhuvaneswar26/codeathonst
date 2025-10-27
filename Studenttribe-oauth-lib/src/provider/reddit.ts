// src/provider/reddit.ts

import axios, { AxiosError } from "axios";
import {
  RedditProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_USER_URL = "https://oauth.reddit.com/api/v1/me";

export class RedditProvider implements OAuthProvider {
  private config: RedditProviderConfig;

  constructor(config: RedditProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      state: state,
      redirect_uri: this.config.redirectUri,
      duration: "permanent",
      scope: this.config.scopes.join(" "),
    });

    return `${REDDIT_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.config.redirectUri,
    });

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    try {
      const { data } = await axios.post(REDDIT_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
          "User-Agent": "UnifiedOAuth/1.0.0",
        },
      });

      // Check for Reddit's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "reddit",
          400,
          data
        );
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        scope: data.scope,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to exchange code for token: ${error.message}`,
          "reddit",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "reddit",
        error
      );
    }
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    try {
      const { data } = await axios.post(REDDIT_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
          "User-Agent": "UnifiedOAuth/1.0.0",
        },
      });

      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "reddit",
          400,
          data
        );
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        scope: data.scope,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to refresh token: ${error.message}`,
          "reddit",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token refresh.`,
        "reddit",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const { data: userData } = await axios.get(REDDIT_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "UnifiedOAuth/1.0.0",
        },
      });

      // Standardize the user profile
      return {
        id: userData.id,
        email: userData.email || null,
        name: userData.name || null,
        firstName: null,
        lastName: null,
        avatarUrl: userData.icon_img || null,
        username: userData.name || null,
        provider: "reddit",
        verified: userData.verified || false,
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "reddit",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "reddit",
        error
      );
    }
  }
}
