"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Suspense } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    const e = searchParams.get("email");
    if (t) setToken(t);
    if (e) setEmail(e);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      // Error is handled by api.js interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/login-bg.png")' }}
      />
      
      {/* Blue Light Color Layer */}
      <div className="absolute inset-0 z-10 bg-blue-600/30 backdrop-blur-[2px]" />

      <div className="relative z-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <Image
                src="/wafaa_logo.jpeg"
                alt="Wafaa Medical Clinic"
                width={240}
                height={80}
                className="h-20 w-auto object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-md">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-blue-50 font-medium">
            Create a new password for your account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl border border-white/20 sm:rounded-xl sm:px-10">
            {isSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Success!</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Your password has been updated. You can now login with your new password.
                </p>
                <div className="mt-6">
                  <Link
                    href="/login"
                    className="flex w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <input type="hidden" value={token} />
                <input type="hidden" value={email} />

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
