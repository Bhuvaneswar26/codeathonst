// src/provider/google.ts

import axios, { AxiosError } from "axios";
import {
  GoogleProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export class GoogleProvider implements OAuthProvider {
  private config: GoogleProviderConfig;

  constructor(config: GoogleProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      response_type: "code",
      state: state,
      access_type: authParams?.access_type || "offline",
      prompt: authParams?.prompt || "consent",
      include_granted_scopes:
        authParams?.include_granted_scopes?.toString() || "true",
    });

    if (authParams?.login_hint) {
      urlParams.set("login_hint", authParams.login_hint);
    }
    if (authParams?.hd) {
      urlParams.set("hd", authParams.hd);
    }

    return `${GOOGLE_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    try {
      const { data } = await axios.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Check for Google's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "google",
          400,
          data
        );
      }

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scope: data.scope,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to exchange code for token: ${error.message}`,
          "google",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "google",
        error
      );
    }
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    try {
      const { data } = await axios.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "google",
          400,
          data
        );
      }

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep existing refresh token if not provided
        scope: data.scope,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to refresh token: ${error.message}`,
          "google",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token refresh.`,
        "google",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const { data: userData } = await axios.get(GOOGLE_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Standardize the user profile
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.given_name,
        lastName: userData.family_name,
        avatarUrl: userData.picture,
        username: userData.email?.split("@")[0] || null,
        provider: "google",
        verified: userData.verified_email,
        locale: userData.locale,
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "google",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "google",
        error
      );
    }
  }

  public async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post(GOOGLE_REVOKE_URL, null, {
        params: { token: accessToken },
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to revoke token: ${error.message}`,
          "google",
          error.response?.data || error
        );
      }
      throw new TokenError(
        "An unknown error occurred during token revocation.",
        "google",
        error
      );
    }
  }
}
