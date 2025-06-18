import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | Rooster - Next.js Dashboard",
  description: "Reset your password for Rooster Dashboard",
};

const ResetPassword = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

export default ResetPassword