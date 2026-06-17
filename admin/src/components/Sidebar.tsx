import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Activity,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const NAV = [
  { to: "/", label: "仪表盘", icon: LayoutDashboard },
  { to: "/users", label: "用户管理", icon: Users },
  { to: "/orders", label: "订单管理", icon: ShoppingCart },
  { to: "/tracking", label: "埋点数据", icon: Activity },
  { to: "/settings", label: "系统配置", icon: Settings },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-gray-200 bg-gray-900 text-gray-300">
      <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-5">
        <Shield size={22} className="text-blue-400" />
        <span className="font-bold text-white">E2M Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-800 text-white"
                  : "hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={16} /> 退出
        </button>
      </div>
    </aside>
  );
}
