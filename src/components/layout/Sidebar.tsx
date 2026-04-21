"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, NotepadText, FileText, Package, CreditCard, BarChart3, Shield, ScrollText } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { stockAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function Sidebar({ 
  isMobileOpen, 
  setIsMobileOpen, 
  isCollapsed, 
  setIsCollapsed 
}: { 
  isMobileOpen?: boolean;
  setIsMobileOpen?: (val: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [stockStatus, setStockStatus] = useState<'normal' | 'low' | 'critical'>('normal');

  const isAdmin = user?.roles?.includes('super-admin');

  useEffect(() => {
    // Only check stock status for super-admins
    if (!isAdmin) return;

    const checkStock = async () => {
      try {
        const response = await stockAPI.list();
        const stocks = response.data || [];

        let hasCritical = false;
        let hasLow = false;

        stocks.forEach((m: any) => {
          const qty = m.quantity || 0;
          const min = m.minimum_stock || 0;
          const reorder = m.reorder_level || 0;

          if (qty <= min) hasCritical = true;
          else if (qty <= reorder) hasLow = true;
        });

        if (hasCritical) setStockStatus('critical');
        else if (hasLow) setStockStatus('low');
        else setStockStatus('normal');
      } catch (error) {
        console.error("Failed to check stock status", error);
      }
    };

    checkStock();
    const interval = setInterval(checkStock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAdmin]);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Vitals", href: "/vitals", icon: Activity },
    { name: "Investigations", href: "/investigations", icon: NotepadText },
    { name: "Prescriptions", href: "/prescriptions", icon: FileText },
    { name: "Cashier", href: "/cashier", icon: CreditCard },
    ...(isAdmin ? [
      {
        name: "Stock",
        href: "/stock",
        icon: Package,
        className: stockStatus === 'critical' ? 'animate-blink-red' : stockStatus === 'low' ? 'animate-blink-yellow' : ''
      },
      { name: "Sales", href: "/sales", icon: BarChart3 },
      { name: "Admin Management", href: "/admin", icon: Shield },
      { name: "Activity Logs", href: "/logs", icon: ScrollText },
    ] : []),
  ];

  return (
    <aside className={`bg-surface border-r border-slate-200 flex flex-col h-full shadow-sm z-30 transition-all duration-300 fixed inset-y-0 left-0 md:relative ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className="h-16 flex items-center justify-center px-4 border-b border-slate-200">
        <Link href="/" className="flex items-center justify-center w-full">
          {!isCollapsed ? (
            <Image
              src="/wafaa_logo.jpeg"
              alt="Wafaa Medical Clinic"
              width={180}
              height={60}
              className="h-15 w-auto object-fit justify-center align-center"
              priority
            />
          ) : (
            <div className="font-bold text-xl text-primary-600 bg-primary-50 p-2 rounded-lg aspect-square flex items-center justify-center h-10 w-10">W</div>
          )}
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
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"} rounded-md text-sm font-medium transition-colors ${actuallyActive
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } ${item.className || ""}`}
              onClick={() => {
                if (window.innerWidth < 768 && setIsMobileOpen) {
                  setIsMobileOpen(false);
                }
              }}
            >
              <item.icon className={`flex-shrink-0 ${isCollapsed ? "h-6 w-6" : "h-5 w-5"}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        {!isCollapsed ? (
          <div className="bg-primary-50 rounded-lg p-3 text-sm text-primary-700 flex flex-col gap-1">
            <span className="font-semibold">Support Center</span>
            <span className="text-xs text-primary-600/80">Need help with ClinicPro?</span>
          </div>
        ) : (
          <div className="bg-primary-50 rounded-lg p-2 flex items-center justify-center text-primary-700" title="Support Center">
            <span className="font-bold text-lg">?</span>
          </div>
        )}
      </div>
    </aside>
  );
}
