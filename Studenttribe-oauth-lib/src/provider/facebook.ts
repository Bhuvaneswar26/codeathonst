// src/provider/facebook.ts

import axios, { AxiosError } from "axios";
import {
  FacebookProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const FACEBOOK_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";
const FACEBOOK_TOKEN_URL =
  "https://graph.facebook.com/v18.0/oauth/access_token";
const FACEBOOK_USER_URL = "https://graph.facebook.com/v18.0/me";
const FACEBOOK_REVOKE_URL = "https://graph.facebook.com/v18.0/me/permissions";

export class FacebookProvider implements OAuthProvider {
  private config: FacebookProviderConfig;

  constructor(config: FacebookProviderConfig) {
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

    return `${FACEBOOK_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri,
    });

    try {
      const { data } = await axios.get(
        `${FACEBOOK_TOKEN_URL}?${params.toString()}`
      );

      // Check for Facebook's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error.message ||
            data.error.error_description ||
            "Facebook API error",
          "facebook",
          data.error.code || 400,
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
          "facebook",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "facebook",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const params = new URLSearchParams({
        fields:
          "id,name,email,first_name,last_name,picture.width(200).height(200),verified",
        access_token: accessToken,
      });

      const { data: userData } = await axios.get(
        `${FACEBOOK_USER_URL}?${params.toString()}`
      );

      // Standardize the user profile
      return {
        id: userData.id,
        email: userData.email || null,
        name: userData.name || null,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        avatarUrl: userData.picture?.data?.url || null,
        username: userData.name?.toLowerCase().replace(/\s+/g, "") || null,
        provider: "facebook",
        verified: userData.verified || false,
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "facebook",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "facebook",
        error
      );
    }
  }

  public async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.delete(`${FACEBOOK_REVOKE_URL}?access_token=${accessToken}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to revoke token: ${error.message}`,
          "facebook",
          error.response?.data || error
        );
      }
      throw new TokenError(
        "An unknown error occurred during token revocation.",
        "facebook",
        error
      );
    }
  }
}
