"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserCircleIcon } from "@/icons";
import LogoutButton from "./LogoutButton";

export default function UserProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full dark:bg-gray-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <UserCircleIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
} 