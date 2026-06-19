import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ExternalLink,
  History,
  Home,
  Presentation,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "创建 PPTX", icon: Home },
  { to: "/history", label: "历史任务", icon: History },
];

const E2M_MAIN_URL = "http://localhost:3000";

export default function Layout() {
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname === to;

  const navCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-primary-50 text-primary-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <Presentation className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-base font-bold text-gray-900">E2M PPTX</h1>
            <p className="text-[11px] text-gray-400">Everything → PPTX</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={navCls(isActive(to))}>
              <Icon size={18} strokeWidth={isActive(to) ? 2.2 : 1.8} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-3 py-3">
          <a
            href={E2M_MAIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ExternalLink size={16} />
            返回主站
          </a>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-4xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
