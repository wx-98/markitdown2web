import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  FileText,
  Globe,
  History,
  Home,
  LogOut,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import SubscriptionBadge from "./SubscriptionBadge";

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: Home },
  { to: "/video", label: "视频转笔记", icon: Video },
  { to: "/url", label: "URL 转笔记", icon: Globe },
  { to: "/document", label: "文档转笔记", icon: FileText },
  { to: "/history", label: "历史记录", icon: History },
  { to: "/pricing", label: "订阅套餐", icon: CreditCard },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <img
            src="/icons/logo-icon.svg"
            alt="E2M"
            className="h-9 w-9"
          />
          <div>
            <h1 className="text-base font-bold text-gray-900">E2M</h1>
            <p className="text-[11px] text-gray-400">Everything → Markdown</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-100 px-4 py-3">
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {user.nickname || user.email || user.phone}
                </p>
                <div className="flex items-center gap-1.5">
                  <SubscriptionBadge />
                  <span className="truncate text-xs text-gray-400">
                    {user.email || user.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
