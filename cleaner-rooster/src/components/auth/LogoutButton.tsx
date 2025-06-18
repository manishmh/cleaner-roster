"use client";

import { ArrowRightIcon } from "@/icons";
import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/signin",
    });
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ${className}`}
    >
      <ArrowRightIcon className="w-4 h-4" />
      <span>Logout</span>
    </button>
  );
} 