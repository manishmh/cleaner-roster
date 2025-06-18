"use client";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import PasswordStrength from "./PasswordStrength";

interface VerifyTokenResponse {
  data?: {
    valid: boolean;
    email?: string;
  };
}

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState<string>("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Form refs
  const passwordRef = useRef<HTMLInputElement>(null);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Reset token is missing. Please use the link from your email.");
        setIsVerifying(false);
        return;
      }

      console.log('token', token);

      try {
        const response = await authApi.verifyResetToken(token);
        console.log('reset respone', response);
        
        const verifyData = response.data as unknown as VerifyTokenResponse;
        if (response.success && verifyData?.data?.valid) {
          setIsValidToken(true);
          if (verifyData.data?.email && typeof verifyData.data.email === 'string') {
            setUserEmail(verifyData.data.email);
          }
        } else {
          setError("Invalid or expired reset token. Please request a new password reset.");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setError("Failed to verify reset token. Please request a new password reset.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (hasFieldError("password")) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidToken || !token) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setValidationErrors({});

    const password = passwordRef.current?.value || "";

    try {
      const response = await authApi.resetPassword({ token, password });
      
      if (response.success) {
        setSuccess("Password reset successfully! You can now sign in with your new password.");
        
        // Clear form
        if (passwordRef.current) passwordRef.current.value = "";
        setPassword("");
        
        // Redirect to sign-in page after a delay
        setTimeout(() => {
          window.location.href = "/signin";
        }, 3000);
      } else {
        if ("validationErrors" in response && response.validationErrors) {
          setValidationErrors(response.validationErrors);
          setError("Please fix the validation errors below");
        } else {
          setError(response.error || "Failed to reset password. Please try again.");
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasFieldError = (field: string) => !!validationErrors[field];
  const getFieldError = (field: string) => validationErrors[field];

  // Show loading state while verifying token
  if (isVerifying) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verifying reset token...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Invalid Reset Link
              </h1>
            </div>
            
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-500 dark:text-red-400">
              {error}
            </div>

            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600"
              >
                Request New Reset Link
              </Link>
              
              <Link
                href="/signin"
                className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userEmail ? `Enter a new password for ${userEmail}` : "Enter your new password"}
            </p>
          </div>
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg dark:bg-green-900/20 dark:border-green-500 dark:text-green-400">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 ${
                        hasFieldError("password")
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-300"
                      }`}
                      onChange={handlePasswordChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {hasFieldError("password") && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError("password")}
                    </p>
                  )}
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isLoading}>
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Remember your password? {""}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 