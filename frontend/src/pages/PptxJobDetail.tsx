import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { getPptxJob, getPptxDownloadUrl, getPptxStreamUrl, getSlidePreviewUrl, listSlides } from "@/api/pptx";
import SlideShow from "@/components/SlideShow";
import { useTaskStore } from "@/stores/taskStore";
import type { PptxJob } from "@/types";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "slide" | "error" | "done";
}

export default function PptxJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<PptxJob | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("连接中...");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [slideCount, setSlideCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const updateStoreTask = useTaskStore((s) => s.updateTask);
  const removeStoreTask = useTaskStore((s) => s.removeTask);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString("zh-CN");
    setLogs((prev) => [...prev, { time, message, type }]);
  }, []);

  // Fetch initial job data + slides for completed jobs
  useEffect(() => {
    if (!jobId) return;
    getPptxJob(jobId)
      .then(async (data) => {
        setJob(data);
        setProgress(data.progress);
        if (data.status === "completed" || data.status === "failed") {
          setIsDone(true);
          setProgress(data.progress);
          if (data.status === "completed") {
            setStatusMsg("PPTX 已生成完成！");
            try {
              const slides = await listSlides(jobId);
              if (slides.length > 0) {
                setSlideCount(slides.length);
                setCurrentSlide(0);
              }
            } catch { /* slides may not exist */ }
          }
          if (data.status === "failed") setStatusMsg(data.error_message || "生成失败");
        }
      })
      .catch((err) => setError(err.message));
  }, [jobId]);

  // SSE streaming (also replays persisted logs for completed jobs)
  useEffect(() => {
    if (!jobId) return;
    // Skip only if we already loaded logs
    if (isDone && logs.length > 0) return;

    const url = getPptxStreamUrl(jobId);
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.progress);
      setStatusMsg(data.message);
      addLog(data.message, "info");
      setJob((prev) => prev ? { ...prev, status: data.status, progress: data.progress } : prev);
      if (!["completed", "failed"].includes(data.status)) {
        updateStoreTask(jobId, { progress: data.progress, status: "processing" });
      }
    });

    es.addEventListener("plan", (e) => {
      const data = JSON.parse(e.data);
      addLog(`设计方案: "${data.title}" — ${data.page_count} 页`, "info");
      data.pages?.forEach((p: { title: string; layout: string }, i: number) => {
        addLog(`  第 ${i + 1} 页: ${p.title} (${p.layout})`, "info");
      });
    });

    es.addEventListener("slide", (e) => {
      const data = JSON.parse(e.data);
      setSlideCount(data.total);
      setCurrentSlide(data.index);
      setProgress(data.progress);
      addLog(data.message, "slide");
    });

    es.addEventListener("done", () => {
      setIsDone(true);
      setProgress(100);
      setStatusMsg("PPTX 已生成完成！");
      addLog("PPTX 文件已生成完成！", "done");
      removeStoreTask(jobId);
      getPptxJob(jobId).then(setJob).catch(() => {});
      es.close();
    });

    es.addEventListener("error", (e: any) => {
      if (e.data) {
        const data = JSON.parse(e.data);
        setStatusMsg(data.message || "生成失败");
        addLog(data.message || "生成失败", "error");
      }
      setIsDone(true);
      setJob((prev) => prev ? { ...prev, status: "failed" } : prev);
      es.close();
    });

    es.onerror = () => {
      if (!isDone) {
        getPptxJob(jobId).then((data) => {
          setJob(data);
          if (data.status === "completed" || data.status === "failed") {
            setIsDone(true);
            setProgress(data.progress);
          }
        }).catch(() => {});
      }
      es.close();
    };

    return () => es.close();
  }, [jobId]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-lg font-medium text-red-600">{error}</p>
        <Link to="/pptx?source=text" className="btn-secondary">返回创建页</Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={24} className="animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">加载中…</span>
      </div>
    );
  }

  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">PPTX 生成</h1>
          <p className="text-sm text-gray-500">
            {job.source_name || "文本输入"} · {job.canvas_format === "ppt169" ? "16:9" : "4:3"} · {job.page_count} 页
          </p>
        </div>
        {isCompleted && (
          <a
            href={getPptxDownloadUrl(job.id)}
            download
            className="btn-primary flex items-center gap-2"
          >
            <Download size={16} /> 下载 PPTX
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div className="card dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{statusMsg}</span>
          <span className="text-sm font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFailed ? "bg-red-500" : isCompleted ? "bg-green-500" : "bg-primary-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Slideshow fullscreen mode */}
      {showSlideshow && slideCount > 0 && (
        <div className="fixed inset-0 z-50 bg-black">
          <SlideShow
            slides={Array.from({ length: slideCount }, (_, i) => getSlidePreviewUrl(job.id, i))}
            aspectRatio={job.canvas_format === "ppt169" ? "16/9" : "4/3"}
            onClose={() => setShowSlideshow(false)}
          />
        </div>
      )}

      {/* Slide Preview (shown when slides are available) */}
      {slideCount > 0 && (
        <div className="card dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              幻灯片预览 ({currentSlide + 1}/{slideCount})
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSlideshow(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                title="演示播放"
              >
                <Play size={14} /> 播放
              </button>
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide <= 0}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))}
                disabled={currentSlide >= slideCount - 1}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-600">
            <img
              src={getSlidePreviewUrl(job.id, currentSlide)}
              alt={`Slide ${currentSlide + 1}`}
              className="w-full"
              style={{ aspectRatio: job.canvas_format === "ppt169" ? "16/9" : "4/3" }}
            />
          </div>
          {/* Slide thumbnails */}
          {slideCount > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: slideCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === currentSlide
                      ? "border-primary-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <img
                    src={getSlidePreviewUrl(job.id, i)}
                    alt={`Slide ${i + 1}`}
                    className="h-14 w-24 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {isFailed && job.error_message && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">生成失败</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">{job.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success download area */}
      {isCompleted && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-8 text-center dark:bg-green-900/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <Download size={28} className="text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-800 dark:text-green-300">
            PPTX 生成完成！原生可编辑格式
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            所有元素均为原生形状，可在 PowerPoint 中直接编辑文字、调整布局
          </p>
          <a href={getPptxDownloadUrl(job.id)} className="btn-primary" download>
            <Download size={16} /> 下载 PPTX 文件
          </a>
        </div>
      )}

      {/* Real-time log — only show when there are log entries or task is in progress */}
      {(logs.length > 0 || !isDone) && (
        <div className="card dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {!isDone && <Loader2 size={14} className="mr-1.5 inline animate-spin" />}
            {isDone ? "生成日志" : "实时日志"}
          </h2>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-gray-300">
            {logs.length === 0 && (
              <p className="text-gray-500">等待事件...</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="mb-0.5">
                <span className="text-gray-500">[{log.time}] </span>
                <span
                  className={
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "done"
                        ? "text-green-400"
                        : log.type === "slide"
                          ? "text-blue-400"
                          : "text-gray-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
