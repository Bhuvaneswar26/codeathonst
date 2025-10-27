// src/provider/twitter.ts

import axios, { AxiosError } from "axios";
import {
  TwitterProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_USER_URL = "https://api.twitter.com/2/users/me";

export class TwitterProvider implements OAuthProvider {
  private config: TwitterProviderConfig;

  constructor(config: TwitterProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state: state,
      code_challenge: "challenge", // PKCE is required for Twitter OAuth 2.0
      code_challenge_method: "plain",
    });

    return `${TWITTER_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      code: code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
      code_verifier: "challenge", // PKCE verification
    });

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    try {
      const { data } = await axios.post(TWITTER_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      });

      // Check for Twitter's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "twitter",
          400,
          data
        );
      }

      return {
        accessToken: data.access_token,
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
          "twitter",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "twitter",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const { data: userData } = await axios.get(TWITTER_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          "user.fields": "id,name,username,profile_image_url,verified",
        },
      });

      // Standardize the user profile
      return {
        id: userData.data.id,
        email: null, // Twitter OAuth 2.0 doesn't provide email by default
        name: userData.data.name || null,
        firstName: null,
        lastName: null,
        avatarUrl: userData.data.profile_image_url || null,
        username: userData.data.username || null,
        provider: "twitter",
        verified: userData.data.verified || false,
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "twitter",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "twitter",
        error
      );
    }
  }
}
