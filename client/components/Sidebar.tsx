import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Home, Users, DollarSign, History, Bell, LogOut, X, Menu, User as UserIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface User {
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  uid: string;
  name?: string;
}

interface SidebarProps {
  user: User;
  apartmentName?: string;
}

export default function Sidebar({ user, apartmentName = "Apartment Block" }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isTenant = user.role === "tenant";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = isTenant
    ? [
        { path: "/dashboard", label: "Dashboard", icon: Home },
        { path: "/pay-rent", label: "Pay Rent (M-Pesa)", icon: DollarSign },
        { path: "/payments", label: "My Payments", icon: History },
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/profile", label: "Profile", icon: UserIcon },
      ]
    : [
        { path: "/dashboard", label: "Dashboard", icon: Home },
        { path: "/tenants", label: "Tenants Manager", icon: Users },
        { path: "/payments", label: "Payments Ledger", icon: DollarSign },
        { path: "/rent-settings", label: "Rent Settings", icon: Settings },
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/profile", label: "Profile", icon: UserIcon },
      ];

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow text-gray-600"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-lg text-white", isTenant ? "bg-purple-600" : "bg-green-600")}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm">RMS</h1>
              <p className="text-xs text-gray-400">Management</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 truncate">{apartmentName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-sm">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? (isTenant ? "bg-purple-600 text-white" : "bg-green-600 text-white")
                    : "text-gray-300 hover:bg-gray-800"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-gray-800 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
}
