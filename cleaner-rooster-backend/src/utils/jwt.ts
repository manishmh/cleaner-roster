import { sign, verify } from "hono/jwt";

export interface AuthTokenPayload {
  userId: number;
  email: string;
  type: "access" | "refresh";
  exp: number;
  iat: number;
  [key: string]: any; // Index signature for compatibility
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;

  constructor(accessSecret: string, refreshSecret?: string) {
    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret || accessSecret + "_refresh";
  }

  /**
   * Generate an access token (15 minutes expiry)
   */
  async generateAccessToken(userId: number, email: string): Promise<string> {
    const payload: AuthTokenPayload = {
      userId,
      email,
      type: "access",
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, this.accessTokenSecret);
  }

  /**
   * Generate a refresh token (7 days expiry)
   */
  async generateRefreshToken(userId: number, email: string): Promise<string> {
    const payload: AuthTokenPayload = {
      userId,
      email,
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, this.refreshTokenSecret);
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId, email),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    try {
      const payload = await verify(token, this.accessTokenSecret) as unknown as AuthTokenPayload;
      
      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  /**
   * Verify a refresh token
   */
  async verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
    try {
      const payload = await verify(token, this.refreshTokenSecret) as unknown as AuthTokenPayload;
      
      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }
}

/**
 * Cookie configuration for different environments
 */
export function getCookieConfig(isProduction: boolean = false) {
  if (isProduction) {
    return {
      httpOnly: true,
      secure: true, // HTTPS required in production
      sameSite: 'none' as const, // Allow cross-origin in production
      path: '/',
      // Don't set domain to allow subdomain flexibility
    };
  } else {
    return {
      httpOnly: true,
      secure: false, // HTTP allowed in development
      sameSite: 'lax' as const, // Allow cross-origin in development
      path: '/',
      // Don't set domain for localhost development
    };
  }
}

/**
 * Generate a secure random token for password reset
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
} 