"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If the user is on the login page, don't show the dashboard shell
  if (pathname === "/login") {
    return <>{children}</>;
  }
  
  // Otherwise, wrap the content in the dashboard shell (sidebar + header)
  return <DashboardLayout>{children}</DashboardLayout>;
}
