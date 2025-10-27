// src/provider/linkedin.ts

import axios, { AxiosError } from "axios";
import {
  LinkedInProviderConfig,
  OAuthProvider,
  TokenResponse,
  UserProfile,
  AuthParams,
} from "../types";
import { TokenError, UserProfileError, ProviderApiError } from "../errors";

// Provider-specific constants
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USER_URL = "https://api.linkedin.com/v2/people/~";
const LINKEDIN_EMAIL_URL =
  "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";

export class LinkedInProvider implements OAuthProvider {
  private config: LinkedInProviderConfig;

  constructor(config: LinkedInProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(state: string, authParams?: AuthParams): string {
    const urlParams = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state: state,
    });

    return `${LINKEDIN_AUTH_URL}?${urlParams.toString()}`;
  }

  public async getToken(code: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const { data } = await axios.post(LINKEDIN_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Check for LinkedIn's specific error response
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "linkedin",
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
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof AxiosError) {
        throw new TokenError(
          `Failed to exchange code for token: ${error.message}`,
          "linkedin",
          error.response?.data || error
        );
      }
      throw new TokenError(
        `An unknown error occurred during token exchange.`,
        "linkedin",
        error
      );
    }
  }

  public async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      // Fetch basic profile information
      const { data: profileData } = await axios.get(LINKEDIN_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          projection:
            "(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
        },
      });

      // Fetch email if available
      let email: string | null = null;
      try {
        const { data: emailData } = await axios.get(LINKEDIN_EMAIL_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (emailData.elements && emailData.elements.length > 0) {
          email = emailData.elements[0]["handle~"]?.emailAddress || null;
        }
      } catch (emailError) {
        // Email might not be available due to scope restrictions
        console.warn("Could not fetch email from LinkedIn:", emailError);
      }

      // Extract profile picture URL
      const avatarUrl =
        profileData.profilePicture?.["displayImage~"]?.elements?.[0]
          ?.identifiers?.[0]?.identifier || null;

      // Standardize the user profile
      return {
        id: profileData.id,
        email: email,
        name:
          profileData.firstName && profileData.lastName
            ? `${profileData.firstName.localized.en_US} ${profileData.lastName.localized.en_US}`
            : null,
        firstName: profileData.firstName?.localized?.en_US || null,
        lastName: profileData.lastName?.localized?.en_US || null,
        avatarUrl: avatarUrl,
        username: profileData.id,
        provider: "linkedin",
        raw: profileData,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new UserProfileError(
          `Failed to fetch user profile: ${error.message}`,
          "linkedin",
          error.response?.data || error
        );
      }
      throw new UserProfileError(
        "An unknown error occurred during user profile fetching.",
        "linkedin",
        error
      );
    }
  }
}
