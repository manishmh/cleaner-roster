import { authApi, LoginSchema } from "@/lib/api";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          try {
            // Use your existing API to authenticate
            const response = await authApi.login({ email, password });

            if (response.success && response.data) {
              // Handle nested response structure from your backend
              const responseData = response.data as unknown as Record<string, unknown>;
              
              let userData: {
                user: { id: number; email: string; name?: string };
                tokens?: { accessToken: string; refreshToken: string };
              } | null = null;
              
              // Check if response.data has nested data (double-wrapped)
              if (responseData.data && typeof responseData.data === 'object' && responseData.data !== null) {
                const nestedData = responseData.data as Record<string, unknown>;
                if (nestedData.user) {
                  userData = responseData.data as {
                    user: { id: number; email: string; name?: string };
                    tokens?: { accessToken: string; refreshToken: string };
                  };
                }
              } else if (responseData.user) {
                userData = responseData as {
                  user: { id: number; email: string; name?: string };
                  tokens?: { accessToken: string; refreshToken: string };
                };
              }
              
              if (!userData) {
                return null;
              }
              
              // Return user object that will be stored in the session
              const user = {
                id: userData.user.id.toString(),
                email: userData.user.email,
                name: userData.user.name || userData.user.email,
                accessToken: userData.tokens?.accessToken,
                refreshToken: userData.tokens?.refreshToken,
              };
              
              return user;
            }
          } catch (error) {
            console.error("Auth error:", error);
          }
        }

        return null;
      },
    }),
    
    // Future OAuth providers can be added here
    // GitHub({
    //   clientId: process.env.GITHUB_CLIENT_ID,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // }),
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.accessToken = token.accessToken as string;
        session.error = token.error as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin", // Redirect errors to sign in page
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (match your refresh token expiry)
  },

  secret: process.env.AUTH_SECRET,
  
  debug: process.env.NODE_ENV === "development",
  
  trustHost: true, // Important for development
} satisfies NextAuthConfig;

async function refreshAccessToken(token: JWT) {
  try {
    // You can implement refresh token logic here if your backend supports it
    // For now, we'll just return the token as is
    // In the future, you can call your backend's refresh endpoint
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
} 