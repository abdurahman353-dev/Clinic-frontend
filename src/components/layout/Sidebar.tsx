"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, NotepadText, FileText, Package, CreditCard } from "lucide-react";
import Image from "next/image";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Vitals", href: "/vitals", icon: Activity },
    { name: "Investigations", href: "/investigations", icon: NotepadText },
    { name: "Prescriptions", href: "/prescriptions", icon: FileText },
    { name: "Cashier", href: "/cashier", icon: CreditCard },
    { name: "Stock", href: "/stock", icon: Package },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-slate-200 hidden md:flex flex-col h-full shadow-sm relative z-10 transition-all duration-300">
      <div className="h-16 flex items-center justify-center px-4 border-b border-slate-200">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/wafaa clinic logo.svg"
            alt="Wafaa Medical Clinic"
            width={180}
            height={60}
            className="h-14 w-auto object-contain justify-center align-center"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hrefExactActive = pathname === "/" && item.href === "/";
          const actuallyActive = item.href === "/" ? hrefExactActive : isActive;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${actuallyActive
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-primary-50 rounded-lg p-3 text-sm text-primary-700 flex flex-col gap-1">
          <span className="font-semibold">Support Center</span>
          <span className="text-xs text-primary-600/80">Need help with ClinicPro?</span>
        </div>
      </div>
    </aside>
  );
}
