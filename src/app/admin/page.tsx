"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  Search,
  Filter,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  Mail,
  Calendar,
  Loader2,
  Trash2,
  Lock
} from "lucide-react";
import { adminAPI, settingsAPI } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "admin"
  });

  // Clinic Settings
  const [consultationFee, setConsultationFee] = useState("");
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeLoaded, setFeeLoaded] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getAdmins({ page: currentPage });
      setAdmins(response.data || []);
      setMeta(response.meta || null);
    } catch (error) {
      toast.error("Failed to load administrators");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      // settingsAPI.get() already returns response.data from axios (in api.js)
      // so response here is { data: { consultation_fee: "500" } }
      const fee = response?.data?.consultation_fee ?? response?.consultation_fee;
      setConsultationFee(fee !== undefined && fee !== null ? String(fee) : "500");
      setFeeLoaded(true);
    } catch (err: any) {
      console.error("Failed to load clinic settings:", err);
      setConsultationFee("500");
      setFeeLoaded(true);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchSettings();
  }, [currentPage]);

  const handleToggleStatus = async (admin: any) => {
    if (admin.roles.includes('super-admin')) {
      toast.error("Super Admin status cannot be modified");
      return;
    }

    try {
      await adminAPI.toggleStatus(admin.id);
      toast.success(`User ${admin.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createAdmin(formData);
      toast.success("Administrator account created successfully");
      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", password: "", password_confirmation: "", role: "admin" });
      fetchAdmins();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create administrator";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveFee = async () => {
    const parsed = parseFloat(String(consultationFee));
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Please enter a valid consultation fee (0 or more)");
      return;
    }
    setIsSavingFee(true);
    try {
      await settingsAPI.update({ consultation_fee: parsed });
      toast.success("Consultation fee updated! New patients will be billed KSh " + parsed.toLocaleString());
    } catch (err) {
      toast.error("Failed to update consultation fee");
    } finally {
      setIsSavingFee(false);
    }
  };

  return (
    <>
      <div className="p-6">
        {/* ── Clinic Settings ──────────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="h-7 w-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </span>
                Clinic Settings
              </h2>
              <p className="text-sm text-slate-500 mt-1">The consultation fee set here is automatically billed to every new patient on registration.</p>
            </div>
            <div className="flex items-center gap-3 min-w-[280px]">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">KSh</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder={feeLoaded ? "" : "Loading..."}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={handleSaveFee}
                disabled={isSavingFee}
                className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-all whitespace-nowrap"
              >
                {isSavingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Fee"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Management</h1>
            <p className="text-slate-500">Manage system administrators and their access levels</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm transition-all shadow-primary-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Admin
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-blue-100/50"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Admins</p>
                <h3 className="text-3xl font-black text-slate-900">{meta?.total || admins.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-emerald-100/50"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Active Accounts</p>
                <h3 className="text-3xl font-black text-slate-900">{admins.filter(a => a.is_active).length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-amber-100/50"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-200">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Pending Reset</p>
                <h3 className="text-3xl font-black text-slate-900">{admins.filter(a => a.must_change_password).length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search admins by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login Security</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
                      Loading administrators...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No administrators found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${admin.is_active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-none mb-1">{admin.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${admin.roles.includes('super-admin')
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                          {admin.roles.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${admin.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                          <span className={`text-xs font-semibold ${admin.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {admin.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {admin.must_change_password ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Reset Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {admin.roles.includes('super-admin') ? (
                            <span className="text-[10px] text-slate-400 font-medium italic">System Protected</span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(admin)}
                              className={`p-2 rounded-lg transition-colors ${admin.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                              title={admin.is_active ? 'Deactivate User' : 'Activate User'}
                            >
                              {admin.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          )}
                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            meta={meta}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Administrator"
        description="Create a new system user with specified privileges."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g. Dr. Jane Smith"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="jane@clinic.com"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="admin">Administrator</option>
                {/* <option value="super-admin">Super Admin</option> */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                required
                type={showPassword ? "text" : "password_confirmation"}
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="••••••••"
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

          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3 mt-4">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700 font-medium">
              New users will be forced to change their password on their next login for security.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
