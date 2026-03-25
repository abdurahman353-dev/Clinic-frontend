"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !token && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/login");
    }
  }, [isLoading, token, pathname, router]);

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
  }

  if (!token) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  );
}
