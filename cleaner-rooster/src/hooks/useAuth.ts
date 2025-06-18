"use client";

import { authApi, userApi, type UserProfile } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch user profile when session is available
  const fetchUserProfile = async () => {
    if (session?.user?.id && status === "authenticated") {
      setIsLoadingProfile(true);
      try {
        const response = await userApi.getProfile(session.user.id);
        if (response.success && response.data) {
          // The actual user data is nested at response.data.data
          const nestedResponse = response.data as { data?: UserProfile; success?: boolean; cached?: boolean };
          if (nestedResponse.data) {
            setUserProfile(nestedResponse.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [session?.user?.id, status]);

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!session?.user?.id) return null;
    
    try {
      const response = await userApi.updateProfile(session.user.id, profileData);
      if (response.success && response.data) {
        console.log('update response:', response);
        // Handle the same nested structure as in fetchUserProfile
        const nestedResponse = response.data as { data?: UserProfile; success?: boolean; cached?: boolean };
        if (nestedResponse.data) {
          setUserProfile(nestedResponse.data);
          return nestedResponse.data;
        }
        // Fallback to direct data if not nested
        setUserProfile(response.data as UserProfile);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to update profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    await fetchUserProfile();
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUserProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user: session?.user,
    userProfile,
    isLoading: status === "loading",
    isLoadingProfile,
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    accessToken: session?.accessToken,
    session,
    updateProfile,
    refreshProfile,
    logout,
  };
} 