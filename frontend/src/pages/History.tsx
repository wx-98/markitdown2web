import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Video,
  XCircle,
} from "lucide-react";
import { getTasks } from "@/api/tasks";
import type { TaskInfo } from "@/types";

const TYPE_META: Record<
  string,
  { icon: typeof Video; color: string; label: string }
> = {
  video: { icon: Video, color: "text-purple-600 bg-purple-100", label: "视频" },
  url: { icon: Globe, color: "text-blue-600 bg-blue-100", label: "URL" },
  document: {
    icon: FileText,
    color: "text-emerald-600 bg-emerald-100",
    label: "文档",
  },
};

const STATUS_META: Record<
  string,
  { icon: typeof Clock; color: string; label: string }
> = {
  pending: { icon: Clock, color: "text-yellow-600", label: "等待中" },
  processing: { icon: Loader2, color: "text-blue-600", label: "处理中" },
  completed: { icon: CheckCircle, color: "text-green-600", label: "已完成" },
  failed: { icon: XCircle, color: "text-red-600", label: "失败" },
};

function getTaskLink(task: TaskInfo): string {
  if (task.status === "completed" && task.result_id) {
    return `/result/${task.result_id}`;
  }
  return `/task/${task.id}`;
}

function getActionLabel(task: TaskInfo): string {
  if (task.status === "completed") return "查看结果";
  if (task.status === "processing" || task.status === "pending") return "查看进度";
  if (task.status === "failed") return "查看详情";
  return "查看";
}

export default function History() {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">历史记录</h1>

      {tasks.length === 0 ? (
        <div className="card py-16 text-center text-gray-400">
          暂无任务记录
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const tm = TYPE_META[task.type] || TYPE_META.document;
            const sm = STATUS_META[task.status] || STATUS_META.pending;
            const Icon = tm.icon;
            const StatusIcon = sm.icon;

            return (
              <Link
                key={task.id}
                to={getTaskLink(task)}
                className="card flex items-center gap-4 transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tm.color}`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.source || "未知来源"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(task.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>

                {/* Progress bar for active tasks */}
                {(task.status === "processing" || task.status === "pending") && (
                  <div className="w-20">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-center text-[10px] text-gray-400">{task.progress}%</p>
                  </div>
                )}

                <span
                  className={`flex items-center gap-1 text-xs font-medium ${sm.color}`}
                >
                  <StatusIcon
                    size={14}
                    className={task.status === "processing" ? "animate-spin" : ""}
                  />
                  {sm.label}
                </span>

                <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary-900/30">
                  {getActionLabel(task)}
                  <ExternalLink size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
