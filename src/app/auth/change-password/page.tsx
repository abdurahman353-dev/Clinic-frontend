"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Loader2, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ForceChangePasswordPage() {
  const { user, setUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    current_password: "",
    password: "",
    password_confirmation: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }
  }, [user]);

  // If user doesn't need to change password, redirect to dashboard
  useEffect(() => {
    if (user && !user.must_change_password) {
      window.location.href = "/";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.current_password === formData.password) {
        toast.error("New password cannot be the same as the current password");
        return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.updateProfile(formData);
      toast.success("Password updated successfully. You can now access the system.");
      
      // Update local user state (must_change_password will be false in response)
      setUser(response.user);
      
      // Small delay for toast before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update password";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-primary-600 p-8 text-center text-white">
            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Secure Your Account</h1>
            <p className="text-primary-100 mt-2 text-sm">You are logged in with a temporary password. Please set a permanent password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                For security reasons, playground administrators are required to set a unique password upon their first entry to the system.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Temporary Password</label>
                <div className="relative">
                  <input
                    required
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm pr-12"
                    placeholder="Enter current password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Permanent Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm pr-12"
                    placeholder="At least 8 characters"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm pr-12"
                    placeholder="Repeat new password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Activate My Account
              </button>
              
              <button
                type="button"
                onClick={logout}
                className="w-full text-slate-500 hover:text-slate-800 text-sm font-medium py-2 transition-colors"
              >
                Cancel and Logout
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8 font-medium italic">
          &copy; 2026 Professional Clinic Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
