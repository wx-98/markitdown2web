import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import type { TaskStatus } from "@/types";

interface Props {
  taskId: string;
  pollFn: (taskId: string) => Promise<TaskStatus>;
}

export default function TaskProgress({ taskId, pollFn }: Props) {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const s = await pollFn(taskId);
        if (cancelled) return;
        setStatus(s);
        if (s.status === "completed" || s.status === "failed") {
          clearInterval(timerRef.current);
        }
      } catch {
        /* ignore transient errors */
      }
    };

    poll();
    timerRef.current = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [taskId, pollFn]);

  if (!status) {
    return (
      <div className="card flex items-center gap-3">
        <Loader2 className="animate-spin text-primary-500" size={20} />
        <span className="text-sm text-gray-600">正在连接...</span>
      </div>
    );
  }

  const { progress } = status;
  const isProcessing = status.status === "processing" || status.status === "pending";
  const isCompleted = status.status === "completed";
  const isFailed = status.status === "failed";

  return (
    <div className="card space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isProcessing && (
          <Loader2 className="animate-spin text-primary-500" size={22} />
        )}
        {isCompleted && (
          <CheckCircle className="text-green-500" size={22} />
        )}
        {isFailed && <XCircle className="text-red-500" size={22} />}
        <span className="font-medium text-gray-800">
          {isProcessing && "正在处理中..."}
          {isCompleted && "处理完成！"}
          {isFailed && "处理失败"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFailed ? "bg-red-400" : "bg-primary-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{progress}%</p>

      {isFailed && status.error_message && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {status.error_message.slice(0, 300)}
        </div>
      )}

      {isCompleted && status.result_id && (
        <button
          onClick={() => navigate(`/result/${status.result_id}`)}
          className="btn-primary w-full"
        >
          查看结果
        </button>
      )}
    </div>
  );
}
