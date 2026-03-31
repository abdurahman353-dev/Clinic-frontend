"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Map URL segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  "": "Dashboard",
  patients: "Patients",
  vitals: "Vitals",
  investigations: "Investigations",
  prescriptions: "Prescriptions",
  cashier: "Cashier",
  stock: "Stock",
  sales: "Sales",
  admin: "Admin",
  logs: "Activity Logs",
  profile: "Profile",
  new: "New",
  edit: "Edit",
  record: "Clinical Record",
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
  auth: "Auth",
};

function formatSegment(segment: string): string {
  // Numeric or UUID-like segment → treat as an ID
  if (/^\d+$/.test(segment)) return `#${segment}`;
  if (/^[a-f0-9-]{36}$/.test(segment)) return `#${segment.slice(0, 8)}`;
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Split path into segments, filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build cumulative href list
  const crumbs = segments.map((seg, i) => ({
    label: formatSegment(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  // Home is always first
  const allCrumbs = [{ label: "Dashboard", href: "/", isLast: crumbs.length === 0 }, ...crumbs];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {allCrumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i === 0 && (
            <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          )}
          {crumb.isLast ? (
            <span className="font-semibold text-slate-800 truncate max-w-[180px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-slate-400 hover:text-slate-600 transition-colors truncate max-w-[120px]"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
