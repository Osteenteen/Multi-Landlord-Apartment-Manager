import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface User {
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  uid: string;
  name?: string;
}

interface PageLayoutProps {
  user: User;
  apartmentName?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  headerRight?: ReactNode;
}

export default function PageLayout({
  user,
  apartmentName,
  title,
  subtitle,
  children,
  headerRight,
}: PageLayoutProps) {
  const isTenant = user.role === "tenant";
  const tenantNameStr = user.name || user.phone;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} apartmentName={apartmentName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="pl-16 lg:pl-0">
            {title && (
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase", isTenant ? "bg-purple-600" : "bg-green-600")}>
                {user.phone.charAt(user.phone.length - 1)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900">{tenantNameStr}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            {headerRight}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
