import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  History,
  Home,
  Loader2,
  LogOut,
  Presentation,
  Settings,
  Sparkles,
  Type,
  Upload,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore, type ActiveTask } from "@/stores/taskStore";
import SubscriptionBadge from "./SubscriptionBadge";

const CONVERTER_ITEMS = [
  { to: "/video", label: "视频转笔记", icon: Video },
  { to: "/url", label: "URL 转笔记", icon: Globe },
  { to: "/document", label: "文档转笔记", icon: FileText },
];

const PPTX_ITEMS = [
  { to: "/pptx?source=text", label: "文本输入", icon: Type },
  { to: "/pptx?source=file", label: "文件上传", icon: Upload },
  { to: "/pptx?source=url", label: "URL 导入", icon: Globe },
];

const HISTORY_ITEMS = [
  { to: "/history", label: "转换历史", icon: FileText },
  { to: "/pptx/history", label: "PPTX 历史", icon: Presentation },
];

const TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  url: Globe,
  document: FileText,
  pptx: Presentation,
};

export default function Layout() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeTasks = useTaskStore((s) => s.activeTasks);
  const syncFromServer = useTaskStore((s) => s.syncFromServer);

  useEffect(() => {
    syncFromServer();
    const timer = setInterval(syncFromServer, 15000);
    return () => clearInterval(timer);
  }, [syncFromServer]);

  const inProgressTasks = activeTasks.filter(
    (t) => t.status === "pending" || t.status === "processing",
  );

  const converterActive = CONVERTER_ITEMS.some((i) => pathname === i.to);
  const pptxActive = pathname === "/pptx";
  const historyActive = pathname === "/history" || pathname === "/pptx/history";

  const [converterOpen, setConverterOpen] = useState(converterActive);
  const [pptxOpen, setPptxOpen] = useState(pptxActive);
  const [historyOpen, setHistoryOpen] = useState(historyActive);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to: string) => {
    if (to.includes("?")) {
      const [path, qs] = to.split("?");
      return pathname === path && search === `?${qs}`;
    }
    return pathname === to;
  };

  const navLinkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
    }`;

  const groupBtnCls = (groupActive: boolean, isOpen: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      groupActive && !isOpen
        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
    }`;

  const subLinkCls = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
      active
        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    }`;

  const renderGroup = (
    label: string,
    icon: typeof Sparkles,
    items: typeof CONVERTER_ITEMS,
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    groupActive: boolean,
  ) => {
    const Icon = icon;
    return (
      <div>
        <button onClick={() => setOpen(!isOpen)} className={groupBtnCls(groupActive, isOpen)}>
          <Icon size={18} strokeWidth={groupActive ? 2.2 : 1.8} />
          <span className="flex-1 text-left">{label}</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3 dark:border-gray-700">
            {items.map(({ to, label: lbl, icon: SubIcon }) => (
              <Link key={to} to={to} className={subLinkCls(isActive(to))}>
                <SubIcon size={15} />
                {lbl}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActiveTask = (task: ActiveTask) => {
    const Icon = TYPE_ICONS[task.type] || FileText;
    const active = pathname === task.detailPath;
    return (
      <Link
        key={task.taskId}
        to={task.detailPath}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
          active
            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        }`}
      >
        <Loader2 size={13} className="animate-spin flex-shrink-0 text-primary-500" />
        <span className="min-w-0 flex-1 truncate">{task.source}</span>
        <span className="text-[10px] text-gray-400">{task.progress}%</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6 dark:border-gray-700">
          <img src="/icons/logo-icon.svg" alt="E2M" className="h-9 w-9" />
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">E2M</h1>
            <p className="text-[11px] text-gray-400">Everything → Markdown & PPTX</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <Link to="/" className={navLinkCls(isActive("/"))}>
            <Home size={18} strokeWidth={isActive("/") ? 2.2 : 1.8} />
            首页
          </Link>

          {renderGroup("Everything 转笔记", Sparkles, CONVERTER_ITEMS, converterOpen, setConverterOpen, converterActive)}
          {renderGroup("Everything 转 PPTX", Presentation, PPTX_ITEMS, pptxOpen, setPptxOpen, pptxActive)}
          {renderGroup("历史记录", History, HISTORY_ITEMS, historyOpen, setHistoryOpen, historyActive)}

          {/* Active tasks section */}
          {inProgressTasks.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <div className="mb-1.5 flex items-center gap-2 px-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                <span className="text-xs font-semibold text-gray-400">
                  进行中 ({inProgressTasks.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {inProgressTasks.map(renderActiveTask)}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom area */}
        <div className="border-t border-gray-100 dark:border-gray-700">
          <Link
            to="/pricing"
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
              isActive("/pricing")
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <CreditCard size={16} />
            订阅套餐
            <SubscriptionBadge />
          </Link>

          {user && (
            <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
              <Link
                to="/profile"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                  {(user.nickname || user.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user.nickname || user.email || user.phone}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {user.email || user.phone}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-0.5">
                <Link
                  to="/profile"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="个人设置"
                >
                  <Settings size={15} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="退出登录"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
