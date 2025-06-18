"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { authApi } from "@/lib/api";
import Link from "next/link";
import React, { useRef, useState } from "react";
import PasswordStrength from "./PasswordStrength";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Form refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
    setIsLoading(true);
    setError("");
    setSuccess("");
    setValidationErrors({});

    const firstName = firstNameRef.current?.value || "";
    const lastName = lastNameRef.current?.value || "";
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    if (!isChecked) {
      setError("Please accept the Terms and Conditions to continue");
      setIsLoading(false);
      return;
    }

    try {
      // Combine firstName and lastName into a single name field
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      const response = await authApi.register({
        name,
        email,
        password
      });

      console.log('response', response);
      
      if (response.success) {
        setSuccess("Registration successful! Please check your email to verify your account.");
        
        // Clear form
        if (firstNameRef.current) firstNameRef.current.value = "";
        if (lastNameRef.current) lastNameRef.current.value = "";
        if (emailRef.current) emailRef.current.value = "";
        if (passwordRef.current) passwordRef.current.value = "";
        setPassword("");
        setIsChecked(false);
        
        // Optionally redirect to sign-in page after a delay
        setTimeout(() => {
          window.location.href = "/signin";
        }, 3000);
      } else {
        if ("validationErrors" in response && response.validationErrors) {
          setValidationErrors(response.validationErrors);
          setError("Please fix the validation errors below");
        } else {
          // Handle nested error response structure
          let errorMessage = "Registration failed. Please try again.";
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error && typeof response.error === 'object' && 'message' in response.error) {
            errorMessage = (response.error as { message: string }).message;
          }
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasFieldError = (field: string) => !!validationErrors[field];
  const getFieldError = (field: string) => validationErrors[field];

  const clearFieldError = (field: string) => {
    if (hasFieldError(field)) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (error) setError("");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
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
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Enter your first name"
                      ref={firstNameRef}
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 ${
                        hasFieldError("name")
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-300"
                      }`}
                      onChange={() => clearFieldError("name")}
                    />
                    {hasFieldError("name") && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {getFieldError("name")}
                      </p>
                    )}
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Enter your last name"
                      ref={lastNameRef}
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 ${
                        hasFieldError("name")
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-300"
                      }`}
                      onChange={() => clearFieldError("name")}
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    ref={emailRef}
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 ${
                      hasFieldError("email")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        : "border-gray-300"
                    }`}
                    onChange={() => clearFieldError("email")}
                  />
                  {hasFieldError("email") && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      ref={passwordRef}
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
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing Up..." : "Sign Up"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?
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
