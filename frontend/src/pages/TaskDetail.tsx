import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileDown,
  FileText,
  Globe,
  Loader2,
  Terminal,
  Video,
  XCircle,
  ClipboardCopy,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getTask, getTaskStreamUrl, getResult, exportResult } from "@/api/tasks";
import { useTaskStore } from "@/stores/taskStore";
import type { TaskInfo, ConversionResult } from "@/types";

const TYPE_META: Record<string, { icon: typeof Video; color: string; label: string }> = {
  video: { icon: Video, color: "text-purple-600 bg-purple-100", label: "视频转笔记" },
  url: { icon: Globe, color: "text-blue-600 bg-blue-100", label: "URL 转笔记" },
  document: { icon: FileText, color: "text-emerald-600 bg-emerald-100", label: "文档转笔记" },
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("正在连接…");
  const [phase, setPhase] = useState<string>("pending");
  const [logs, setLogs] = useState<string[]>([]);
  const [streamedMd, setStreamedMd] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const mdRef = useRef("");
  const isDone = phase === "completed" || phase === "failed";
  const updateStoreTask = useTaskStore((s) => s.updateTask);
  const removeStoreTask = useTaskStore((s) => s.removeTask);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-200), msg]);
  }, []);

  // Fetch initial task data
  useEffect(() => {
    if (!taskId) return;
    getTask(taskId).then((t) => {
      setTask(t);
      setProgress(t.progress);
      setPhase(t.status);
      if (t.error_message) setErrorMsg(t.error_message);
      if (t.result_id) setResultId(t.result_id);
      if (t.status === "completed") {
        setStatusMsg("处理完成！");
        setProgress(100);
      } else if (t.status === "failed") {
        setStatusMsg("处理失败");
      }
    }).catch(() => navigate("/history"));
  }, [taskId, navigate]);

  // Load result when available
  useEffect(() => {
    if (!resultId) return;
    getResult(resultId).then((r) => {
      setResult(r);
      setTitle(r.title);
      setStreamedMd(r.markdown_content);
    }).catch(() => {});
  }, [resultId]);

  // SSE streaming (also replays persisted logs for completed/failed tasks)
  useEffect(() => {
    if (!taskId) return;
    // Don't reconnect if we already have logs for a finished task
    if (isDone && logs.length > 0) return;

    const url = getTaskStreamUrl(taskId);
    const es = new EventSource(url);
    esRef.current = es;
    let sseConnected = false;

    es.addEventListener("progress", (e) => {
      sseConnected = true;
      const d = JSON.parse(e.data);
      setProgress(d.progress);
      setStatusMsg(d.message);
      setPhase("processing");
      updateStoreTask(taskId, { progress: d.progress, status: "processing" });
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
      if (d.result_id) setResultId(d.result_id);
      if (d.title) setTitle(d.title);
      setStatusMsg("处理完成！");
      addLog("✓ 任务完成");
      removeStoreTask(taskId);
      es.close();
    });

    es.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const d = JSON.parse(e.data);
        setPhase("failed");
        setErrorMsg(d.message);
        addLog(`✗ ${d.message?.slice(0, 200)}`);
        removeStoreTask(taskId);
      }
      es.close();
    });

    es.onerror = () => {
      if (!sseConnected) {
        es.close();
        startPolling();
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function startPolling() {
    if (!taskId) return;
    const timer = setInterval(async () => {
      try {
        const t = await getTask(taskId);
        setProgress(t.progress);
        setPhase(t.status);
        if (t.error_message) setErrorMsg(t.error_message);
        if (t.result_id) setResultId(t.result_id);
        if (t.status === "completed" || t.status === "failed") {
          clearInterval(timer);
          if (t.status === "completed") setStatusMsg("处理完成！");
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(timer);
  }

  const handleExport = async (format: "markdown" | "word" | "pdf") => {
    if (!resultId) return;
    setExporting(format);
    try {
      const blob = await exportResult(resultId, format);
      const ext = { markdown: "md", word: "docx", pdf: "pdf" }[format];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "notes"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExporting(null);
  };

  const handleCopy = () => {
    if (streamedMd) navigator.clipboard.writeText(streamedMd);
  };

  const tm = TYPE_META[task?.type || "document"] || TYPE_META.document;
  const Icon = tm.icon;
  const isProcessing = phase === "processing" || phase === "pending";
  const isCompleted = phase === "completed";
  const isFailed = phase === "failed";

  if (!task) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tm.color}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {title || tm.label}
          </h1>
          <p className="truncate text-sm text-gray-500">{task.source}</p>
        </div>
        {isCompleted && resultId && (
          <Link to={`/result/${resultId}`} className="btn-primary flex items-center gap-2">
            <FileText size={16} /> 查看完整笔记
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div className="card dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessing && <Loader2 className="animate-spin text-primary-500" size={16} />}
            {isCompleted && <CheckCircle className="text-green-500" size={16} />}
            {isFailed && <XCircle className="text-red-500" size={16} />}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{statusMsg}</span>
          </div>
          <span className="text-sm font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFailed ? "bg-red-400" : isCompleted ? "bg-green-500" : "bg-primary-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {isFailed && errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMsg.slice(0, 500)}</p>
        </div>
      )}

      {/* Streamed / Final markdown preview */}
      {streamedMd && (
        <div className="card dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <FileText size={16} />
              <span>{isCompleted ? "笔记内容" : "AI 笔记生成中…"}</span>
              {isProcessing && <Loader2 className="animate-spin" size={14} />}
            </div>
            {isCompleted && (
              <div className="flex gap-1.5">
                <button onClick={handleCopy} className="btn-secondary text-xs" title="复制">
                  <ClipboardCopy size={13} />
                </button>
                <button
                  onClick={() => handleExport("markdown")}
                  disabled={!!exporting}
                  className="btn-secondary text-xs"
                >
                  .md
                </button>
                <button
                  onClick={() => handleExport("word")}
                  disabled={!!exporting}
                  className="btn-secondary text-xs"
                >
                  .docx
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={!!exporting}
                  className="btn-primary text-xs"
                >
                  <FileDown size={13} />
                  {exporting === "pdf" ? "…" : ".pdf"}
                </button>
              </div>
            )}
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <MarkdownRenderer content={streamedMd} />
          </div>
        </div>
      )}

      {/* Log panel */}
      {logs.length > 0 && (
        <div className="card dark:border-gray-700 dark:bg-gray-800">
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
