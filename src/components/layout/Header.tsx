"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, Search, UserCircle, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStock } from "@/hooks/useStock";
import Link from "next/link";

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { medicines, fetchMedicines } = useStock();

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const stockAlertStatus = useMemo(() => {
    let status = 'none';
    medicines.forEach((m: any) => {
      const qty = m.stock?.quantity || 0;
      const min = m.stock?.minimum_stock || 0;
      const reorder = m.stock?.reorder_level || 0;
      
      if (qty <= min) {
        status = 'critical';
      } else if (qty <= reorder && status !== 'critical') {
        status = 'low';
      }
    });
    return status;
  }, [medicines]);

  let bellColorClass = "text-slate-400 hover:text-slate-500";
  let bellBgClass = "hover:bg-slate-100";
  let bellAnimationClass = "";

  if (stockAlertStatus === 'critical') {
    bellColorClass = "text-red-600";
    bellBgClass = "bg-red-50 hover:bg-red-100";
    bellAnimationClass = "animate-pulse";
  } else if (stockAlertStatus === 'low') {
    bellColorClass = "text-amber-500";
    bellBgClass = "bg-amber-50 hover:bg-amber-100";
    bellAnimationClass = "animate-pulse";
  }

  return (
    <header className="h-16 bg-surface border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-4">
        <Link href="/stock" className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${bellColorClass} ${bellBgClass} ${bellAnimationClass}`} title={stockAlertStatus !== 'none' ? `Stock Alert: ${stockAlertStatus}` : "Notifications"}>
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
        </Link>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <UserCircle className="h-6 w-6" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name || "User"}</span>
          </button>

          {isMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="mr-2 h-4 w-4 text-slate-500" />
                Your Profile
              </Link>
              <button
                onClick={() => {
                   setIsMenuOpen(false);
                   logout();
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left"
              >
                <LogOut className="mr-2 h-4 w-4 text-slate-500" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
