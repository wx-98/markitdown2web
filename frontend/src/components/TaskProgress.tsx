import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle, Terminal, FileText } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { TaskStatus } from "@/types";

interface Props {
  taskId: string;
  pollFn: (taskId: string) => Promise<TaskStatus>;
}

export default function TaskProgress({ taskId, pollFn }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("正在连接…");
  const [phase, setPhase] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [resultId, setResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [streamedMd, setStreamedMd] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const navigate = useNavigate();
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const mdRef = useRef("");
  const isDone = phase === "completed" || phase === "failed";

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-200), msg]);
  }, []);

  useEffect(() => {
    if (!taskId || isDone) return;

    const url = `/api/v1/tasks/${taskId}/stream`;
    const es = new EventSource(url);
    esRef.current = es;
    let sseConnected = false;

    es.addEventListener("progress", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      setProgress(d.progress);
      setStatusMsg(d.message);
      setPhase("processing");
    });

    es.addEventListener("status", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      setPhase(d.status);
    });

    es.addEventListener("log", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      addLog(d.message);
    });

    es.addEventListener("token", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      mdRef.current += d.token;
      setStreamedMd(mdRef.current);
    });

    es.addEventListener("done", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      setPhase("completed");
      setProgress(100);
      setResultId(d.result_id);
      setTitle(d.title);
      setStatusMsg("处理完成！");
      addLog("✓ 任务完成");
      es.close();
    });

    es.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const d = JSON.parse(e.data);
        setPhase("failed");
        setErrorMsg(d.message);
        addLog(`✗ ${d.message?.slice(0, 200)}`);
      }
      es.close();
    });

    es.onerror = () => {
      if (!sseConnected && !isDone) {
        es.close();
        startPolling();
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, isDone, addLog]);

  function startPolling() {
    const poll = async () => {
      try {
        const s = await pollFn(taskId);
        setProgress(s.progress);
        setPhase(s.status as typeof phase);
        if (s.error_message) setErrorMsg(s.error_message);
        if (s.result_id) setResultId(s.result_id);
        if (s.status === "completed" || s.status === "failed") {
          clearInterval(timerRef.current);
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    timerRef.current = setInterval(poll, 2000);
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const isProcessing = phase === "processing" || phase === "pending";
  const isCompleted = phase === "completed";
  const isFailed = phase === "failed";

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          {isProcessing && <Loader2 className="animate-spin text-primary-500" size={22} />}
          {isCompleted && <CheckCircle className="text-green-500" size={22} />}
          {isFailed && <XCircle className="text-red-500" size={22} />}
          <div className="flex-1">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {isProcessing && statusMsg}
              {isCompleted && (title ? `✓ ${title}` : "处理完成！")}
              {isFailed && "处理失败"}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-500">{progress}%</span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFailed ? "bg-red-400" : "bg-primary-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {isFailed && errorMsg && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {errorMsg.slice(0, 500)}
          </div>
        )}

        {isCompleted && resultId && (
          <button
            onClick={() => navigate(`/result/${resultId}`)}
            className="btn-primary w-full"
          >
            <FileText size={16} className="mr-1.5" />
            查看完整笔记
          </button>
        )}
      </div>

      {/* Streamed markdown preview */}
      {streamedMd && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <FileText size={16} />
            <span>AI 笔记生成中…</span>
            {isProcessing && <Loader2 className="animate-spin" size={14} />}
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <MarkdownRenderer content={streamedMd} />
          </div>
        </div>
      )}

      {/* Collapsible log panel */}
      {logs.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            <Terminal size={16} />
            <span>处理日志 ({logs.length})</span>
            <span className="ml-auto text-xs">{showLogs ? "收起" : "展开"}</span>
          </button>
          {showLogs && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
              {logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
