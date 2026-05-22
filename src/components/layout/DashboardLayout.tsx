"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && user?.must_change_password && pathname !== "/auth/change-password") {
      router.push("/auth/change-password");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading || (user?.must_change_password && pathname !== "/auth/change-password")) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 relative">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
