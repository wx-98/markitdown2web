import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Clock,
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
      <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>

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
              <div
                key={task.id}
                className="card flex items-center gap-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tm.color}`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {task.source || "未知来源"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(task.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${sm.color}`}
                  >
                    <StatusIcon
                      size={14}
                      className={
                        task.status === "processing" ? "animate-spin" : ""
                      }
                    />
                    {sm.label}
                  </span>

                  {task.status === "completed" && task.result_id && (
                    <Link
                      to={`/result/${task.result_id}`}
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
                    >
                      查看结果
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
