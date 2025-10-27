"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthorizationError: () => AuthorizationError,
  ConfigurationError: () => ConfigurationError,
  OAuthError: () => OAuthError,
  ProviderApiError: () => ProviderApiError,
  StateMismatchError: () => StateMismatchError,
  TokenError: () => TokenError,
  UnifiedOAuth: () => UnifiedOAuth,
  UserProfileError: () => UserProfileError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var OAuthError = class extends Error {
  provider;
  cause;
  // Stores the original error
  constructor(message, provider, cause) {
    super(message);
    this.name = "OAuthError";
    this.provider = provider;
    this.cause = cause;
  }
};
var TokenError = class extends OAuthError {
  constructor(message, provider, cause) {
    super(message, provider, cause);
    this.name = "TokenError";
  }
};
var UserProfileError = class extends OAuthError {
  constructor(message, provider, cause) {
    super(message, provider, cause);
    this.name = "UserProfileError";
  }
};
var ProviderApiError = class extends OAuthError {
  status;
  responseData;
  constructor(message, provider, status, data, cause) {
    super(message, provider, cause);
    this.name = "ProviderApiError";
    this.status = status;
    this.responseData = data;
  }
};
var AuthorizationError = class extends OAuthError {
  constructor(message, provider, cause) {
    super(message, provider, cause);
    this.name = "AuthorizationError";
  }
};
var StateMismatchError = class extends OAuthError {
  constructor(message, provider, cause) {
    super(message, provider, cause);
    this.name = "StateMismatchError";
  }
};
var ConfigurationError = class extends OAuthError {
  constructor(message, provider, cause) {
    super(message, provider, cause);
    this.name = "ConfigurationError";
  }
};

// src/provider/github.ts
var import_axios = __toESM(require("axios"));
var GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
var GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
var GITHUB_USER_URL = "https://api.github.com/user";
var GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails";
var GitHubProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state
    });
    return `${GITHUB_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri
    });
    try {
      const { data } = await import_axios.default.post(GITHUB_TOKEN_URL, params.toString(), {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
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
        tokenType: data.token_type
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: userData } = await import_axios.default.get(GITHUB_USER_URL, {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });
      let primaryEmail = userData.email;
      if (!primaryEmail) {
        primaryEmail = await this.getPrimaryEmail(accessToken);
      }
      return {
        id: userData.id.toString(),
        email: primaryEmail,
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        provider: "github",
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios.AxiosError) {
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
  async getPrimaryEmail(accessToken) {
    try {
      const { data: emails } = await import_axios.default.get(GITHUB_USER_EMAILS_URL, {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });
      if (!Array.isArray(emails)) return null;
      const primary = emails.find((email) => email.primary === true);
      return primary ? primary.email : null;
    } catch (error) {
      console.warn("Could not fetch user emails.", error);
      return null;
    }
  }
};

// src/provider/google.ts
var import_axios2 = __toESM(require("axios"));
var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
var GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
var GoogleProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      response_type: "code",
      state,
      access_type: authParams?.access_type || "offline",
      prompt: authParams?.prompt || "consent",
      include_granted_scopes: authParams?.include_granted_scopes?.toString() || "true"
    });
    if (authParams?.login_hint) {
      urlParams.set("login_hint", authParams.login_hint);
    }
    if (authParams?.hd) {
      urlParams.set("hd", authParams.hd);
    }
    return `${GOOGLE_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri
    });
    try {
      const { data } = await import_axios2.default.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "google",
          400,
          data
        );
      }
      const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scope: data.scope,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios2.AxiosError) {
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
  async refreshToken(refreshToken) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    });
    try {
      const { data } = await import_axios2.default.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      if (data.error) {
        throw new ProviderApiError(
          data.error_description || data.error,
          "google",
          400,
          data
        );
      }
      const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        // Keep existing refresh token if not provided
        scope: data.scope,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios2.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: userData } = await import_axios2.default.get(GOOGLE_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
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
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios2.AxiosError) {
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
  async revokeToken(accessToken) {
    try {
      await import_axios2.default.post(GOOGLE_REVOKE_URL, null, {
        params: { token: accessToken }
      });
    } catch (error) {
      if (error instanceof import_axios2.AxiosError) {
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
};

// src/provider/facebook.ts
var import_axios3 = __toESM(require("axios"));
var FACEBOOK_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";
var FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";
var FACEBOOK_USER_URL = "https://graph.facebook.com/v18.0/me";
var FACEBOOK_REVOKE_URL = "https://graph.facebook.com/v18.0/me/permissions";
var FacebookProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(","),
      response_type: "code",
      state
    });
    return `${FACEBOOK_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri
    });
    try {
      const { data } = await import_axios3.default.get(
        `${FACEBOOK_TOKEN_URL}?${params.toString()}`
      );
      if (data.error) {
        throw new ProviderApiError(
          data.error.message || data.error.error_description || "Facebook API error",
          "facebook",
          data.error.code || 400,
          data
        );
      }
      return {
        accessToken: data.access_token,
        tokenType: "Bearer",
        expiresIn: data.expires_in,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios3.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const params = new URLSearchParams({
        fields: "id,name,email,first_name,last_name,picture.width(200).height(200),verified",
        access_token: accessToken
      });
      const { data: userData } = await import_axios3.default.get(
        `${FACEBOOK_USER_URL}?${params.toString()}`
      );
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
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios3.AxiosError) {
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
  async revokeToken(accessToken) {
    try {
      await import_axios3.default.delete(`${FACEBOOK_REVOKE_URL}?access_token=${accessToken}`);
    } catch (error) {
      if (error instanceof import_axios3.AxiosError) {
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
};

// src/provider/linkedin.ts
var import_axios4 = __toESM(require("axios"));
var LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
var LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
var LINKEDIN_USER_URL = "https://api.linkedin.com/v2/people/~";
var LINKEDIN_EMAIL_URL = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";
var LinkedInProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state
    });
    return `${LINKEDIN_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    try {
      const { data } = await import_axios4.default.post(LINKEDIN_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
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
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios4.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: profileData } = await import_axios4.default.get(LINKEDIN_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          projection: "(id,firstName,lastName,profilePicture(displayImage~:playableStreams))"
        }
      });
      let email = null;
      try {
        const { data: emailData } = await import_axios4.default.get(LINKEDIN_EMAIL_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        if (emailData.elements && emailData.elements.length > 0) {
          email = emailData.elements[0]["handle~"]?.emailAddress || null;
        }
      } catch (emailError) {
        console.warn("Could not fetch email from LinkedIn:", emailError);
      }
      const avatarUrl = profileData.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier || null;
      return {
        id: profileData.id,
        email,
        name: profileData.firstName && profileData.lastName ? `${profileData.firstName.localized.en_US} ${profileData.lastName.localized.en_US}` : null,
        firstName: profileData.firstName?.localized?.en_US || null,
        lastName: profileData.lastName?.localized?.en_US || null,
        avatarUrl,
        username: profileData.id,
        provider: "linkedin",
        raw: profileData
      };
    } catch (error) {
      if (error instanceof import_axios4.AxiosError) {
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
};

// src/provider/twitter.ts
var import_axios5 = __toESM(require("axios"));
var TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
var TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
var TWITTER_USER_URL = "https://api.twitter.com/2/users/me";
var TwitterProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state,
      code_challenge: "challenge",
      // PKCE is required for Twitter OAuth 2.0
      code_challenge_method: "plain"
    });
    return `${TWITTER_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
      code_verifier: "challenge"
      // PKCE verification
    });
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");
    try {
      const { data } = await import_axios5.default.post(TWITTER_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`
        }
      });
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
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0,
        scope: data.scope
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios5.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: userData } = await import_axios5.default.get(TWITTER_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          "user.fields": "id,name,username,profile_image_url,verified"
        }
      });
      return {
        id: userData.data.id,
        email: null,
        // Twitter OAuth 2.0 doesn't provide email by default
        name: userData.data.name || null,
        firstName: null,
        lastName: null,
        avatarUrl: userData.data.profile_image_url || null,
        username: userData.data.username || null,
        provider: "twitter",
        verified: userData.data.verified || false,
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios5.AxiosError) {
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
};

// src/provider/instagram.ts
var import_axios6 = __toESM(require("axios"));
var INSTAGRAM_AUTH_URL = "https://api.instagram.com/oauth/authorize";
var INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
var INSTAGRAM_USER_URL = "https://graph.instagram.com/me";
var InstagramProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(","),
      response_type: "code",
      state
    });
    return `${INSTAGRAM_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
      code
    });
    try {
      const { data } = await import_axios6.default.post(
        INSTAGRAM_TOKEN_URL,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );
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
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios6.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: userData } = await import_axios6.default.get(INSTAGRAM_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          fields: "id,username,account_type,media_count"
        }
      });
      return {
        id: userData.id,
        email: null,
        // Instagram Basic Display API doesn't provide email
        name: userData.username || null,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        // Instagram Basic Display API doesn't provide profile picture
        username: userData.username || null,
        provider: "instagram",
        verified: false,
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios6.AxiosError) {
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
};

// src/provider/reddit.ts
var import_axios7 = __toESM(require("axios"));
var REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/authorize";
var REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
var REDDIT_USER_URL = "https://oauth.reddit.com/api/v1/me";
var RedditProvider = class {
  config;
  constructor(config) {
    this.config = config;
  }
  getAuthUrl(state, authParams) {
    const urlParams = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      state,
      redirect_uri: this.config.redirectUri,
      duration: "permanent",
      scope: this.config.scopes.join(" ")
    });
    return `${REDDIT_AUTH_URL}?${urlParams.toString()}`;
  }
  async getToken(code, state) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri
    });
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");
    try {
      const { data } = await import_axios7.default.post(REDDIT_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
          "User-Agent": "UnifiedOAuth/1.0.0"
        }
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
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0,
        scope: data.scope
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios7.AxiosError) {
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
  async refreshToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");
    try {
      const { data } = await import_axios7.default.post(REDDIT_TOKEN_URL, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
          "User-Agent": "UnifiedOAuth/1.0.0"
        }
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
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0,
        scope: data.scope
      };
    } catch (error) {
      if (error instanceof ProviderApiError) throw error;
      if (error instanceof import_axios7.AxiosError) {
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
  async getUserProfile(accessToken) {
    try {
      const { data: userData } = await import_axios7.default.get(REDDIT_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "UnifiedOAuth/1.0.0"
        }
      });
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
        raw: userData
      };
    } catch (error) {
      if (error instanceof import_axios7.AxiosError) {
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
};

// src/index.ts
var UnifiedOAuth = class {
  providers;
  constructor(config) {
    this.providers = /* @__PURE__ */ new Map();
    if (config.google) {
      this.providers.set("google", new GoogleProvider(config.google));
    }
    if (config.facebook) {
      this.providers.set("facebook", new FacebookProvider(config.facebook));
    }
    if (config.linkedin) {
      this.providers.set("linkedin", new LinkedInProvider(config.linkedin));
    }
    if (config.twitter) {
      this.providers.set("twitter", new TwitterProvider(config.twitter));
    }
    if (config.instagram) {
      this.providers.set("instagram", new InstagramProvider(config.instagram));
    }
    if (config.reddit) {
      this.providers.set("reddit", new RedditProvider(config.reddit));
    }
    if (config.github) {
      this.providers.set("github", new GitHubProvider(config.github));
    }
  }
  /**
   * Gets the implementation for a specific provider.
   * @param name - The name of the provider (e.g., 'github', 'google', etc.)
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" is not configured or supported.`);
    }
    return provider;
  }
  /**
   * Gets a list of all configured providers.
   */
  getConfiguredProviders() {
    return Array.from(this.providers.keys());
  }
  /**
   * Checks if a provider is configured.
   * @param name - The name of the provider to check
   */
  isProviderConfigured(name) {
    return this.providers.has(name);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthorizationError,
  ConfigurationError,
  OAuthError,
  ProviderApiError,
  StateMismatchError,
  TokenError,
  UnifiedOAuth,
  UserProfileError
});
