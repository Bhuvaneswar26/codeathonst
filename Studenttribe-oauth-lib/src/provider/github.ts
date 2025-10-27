// src/github.ts

import axios, { AxiosError } from "axios";
import {
  GitHubProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails";

export class GitHubProvider implements OAuthProvider {
  private config: GitHubProviderConfig;

  constructor(config: GitHubProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state: state,
    });
    return `${GITHUB_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri,
    });

    try {
      const { data } = await axios.post(GITHUB_TOKEN_URL, params.toString(), {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Check for GitHub's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "github",
          400,
          data
        );
      }

      return {
        accessToken: data.access_token,
        scope: data.scope,
        tokenType: data.token_type,
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to exchange code for token: ${error.message}`,
          "github",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "github",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      // Fetch the main user profile
      const { data: userData } = await axios.get(GITHUB_USER_URL, {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });

      // GitHub user email can be null, try to find a primary one
      let primaryEmail: string | null = userData.email;
      if (!primaryEmail) {
        primaryEmail = await this.getPrimaryEmail(accessToken);
      }

      // Standardize the user profile
      return {
        id: userData.id.toString(),
        email: primaryEmail,
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        provider: "github",
        raw: userData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "github",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "github",
        error
      );
    }
  }

  /**
   * Helper to find the user's primary email if not public.
   */
  private async getPrimaryEmail(accessToken: string): Promise<string | null> {
    try {
      const { data: emails } = await axios.get(GITHUB_USER_EMAILS_URL, {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });

      if (!Array.isArray(emails)) return null;

      const primary = emails.find((email) => email.primary === true);
      return primary ? primary.email : null;
    } catch (error) {
      // Don't fail the whole request, just log and return null
      console.warn("Could not fetch user emails.", error);
      return null;
    }
  }
}
