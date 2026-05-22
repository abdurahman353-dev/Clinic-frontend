"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import { Loader2, User, Save, CheckCircle2, Eye, EyeOff, ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    current_password: "",
    password_confirmation: "",
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });
    
    try {
      if (formData.password && formData.password !== formData.password_confirmation) {
        setMessage({ text: "New passwords do not match", type: "error" });
        setIsSubmitting(false);
        return;
      }

      if (formData.password && formData.current_password === formData.password) {
        setMessage({ text: "New password cannot be the same as the current password", type: "error" });
        setIsSubmitting(false);
        return;
      }

      // Exclude password if empty
      const payload: any = { name: formData.name, email: formData.email };
      if (formData.password.trim()) {
         payload.current_password = formData.current_password;
         payload.password = formData.password;
         payload.password_confirmation = formData.password_confirmation;
      }

      const res = await authAPI.updateProfile(payload);
      
      setUser(res.user);
      setMessage({ text: "Profile updated successfully! Redirecting to login...", type: "success" });
      setFormData(prev => ({ ...prev, password: "", current_password: "", password_confirmation: "" })); 
      
      // Redirect to login after 1.5s to let them see the success message
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
          title="Go Back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account credentials and details.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
           <div className="h-16 w-16 bg-primary-100 text-primary-700 flex items-center justify-center rounded-full">
             <User className="h-8 w-8" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
             <p className="text-slate-500">{user?.roles?.[0] || 'Administrator'}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-md text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    placeholder="Enter current password to change"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                    minLength={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    minLength={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters if provided.</p>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <X className="-ml-1 mr-2 h-4 w-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Saving...</>
              ) : (
                <><Save className="-ml-1 mr-2 h-4 w-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
