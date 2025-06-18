"use client";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { authApi } from "@/lib/api";
import Link from "next/link";
import React, { useRef, useState } from "react";

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Form refs
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setValidationErrors({});

    const email = emailRef.current?.value || "";

    try {
      const response = await authApi.forgotPassword({ email });
      
      if (response.success) {
        setSuccess("If the email exists in our system, a password reset link has been sent to your email address.");
        
        // Clear form
        if (emailRef.current) emailRef.current.value = "";
      } else {
        if ("validationErrors" in response && response.validationErrors) {
          setValidationErrors(response.validationErrors);
          setError("Please fix the validation errors below");
        } else {
          setError(response.error || "Failed to process password reset request. Please try again.");
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasFieldError = (field: string) => !!validationErrors[field];
  const getFieldError = (field: string) => validationErrors[field];

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
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
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
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="Enter your email address"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300  focus:ring-brand-500/10 dark:border-gray-700 ${
                      hasFieldError("email")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        : "border-gray-300"
                    }`}
                    onChange={() => {
                      if (hasFieldError("email")) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                      if (error) setError("");
                    }}
                  />
                  {hasFieldError("email") && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
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