// src/provider/instagram.ts

import axios, { AxiosError } from "axios";
import {
  InstagramProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const INSTAGRAM_AUTH_URL = "https://api.instagram.com/oauth/authorize";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_USER_URL = "https://graph.instagram.com/me";

export class InstagramProvider implements OAuthProvider {
  private config: InstagramProviderConfig;

  constructor(config: InstagramProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(","),
      response_type: "code",
      state: state,
    });

    return `${INSTAGRAM_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
      code: code,
    });

    try {
      const { data } = await axios.post(
        INSTAGRAM_TOKEN_URL,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Check for Instagram's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_message || data.error,
          "instagram",
          400,
          data
        );
      }

      return {
        accessToken: data.access_token,
        tokenType: "Bearer",
        expiresIn: data.expires_in,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to exchange code for token: ${error.message}`,
          "instagram",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "instagram",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const { data: userData } = await axios.get(INSTAGRAM_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          fields: "id,username,account_type,media_count",
        },
      });

      // Standardize the user profile
      return {
        id: userData.id,
        email: null, // Instagram Basic Display API doesn't provide email
        name: userData.username || null,
        firstName: null,
        lastName: null,
        avatarUrl: null, // Instagram Basic Display API doesn't provide profile picture
        username: userData.username || null,
        provider: "instagram",
        verified: false,
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "instagram",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "instagram",
        error
      );
    }
  }
}
