import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Download, RefreshCw } from "lucide-react";
import { getJob, getDownloadUrl } from "@/api/pptx";
import JobProgress from "@/components/JobProgress";
import type { PptxJob } from "@/types";

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<PptxJob | null>(null);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const data = await getJob(jobId);
        setJob(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(timerRef.current);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(timerRef.current);
      }
    };

    fetchJob();
    timerRef.current = setInterval(fetchJob, 2000);
    return () => clearInterval(timerRef.current);
  }, [jobId]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-lg font-medium text-red-600">{error}</p>
        <Link to="/" className="btn-secondary">
          返回首页
        </Link>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">任务详情</h1>
          <p className="text-sm text-gray-500">
            {job.source_name || "文本输入"} · {job.canvas_format === "ppt169" ? "16:9" : "4:3"} ·{" "}
            {job.page_count} 页
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <JobProgress job={job} />
      </div>

      {/* Error */}
      {job.status === "failed" && job.error_message && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-700">生成失败</p>
              <p className="mt-1 text-sm text-red-600">{job.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Download */}
      {job.status === "completed" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Download size={28} className="text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-800">PPTX 生成完成！</p>
          <a
            href={getDownloadUrl(job.id)}
            className="btn-primary"
            download
          >
            <Download size={16} />
            下载 PPTX 文件
          </a>
        </div>
      )}

      {/* Meta info */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          任务信息
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">任务 ID</dt>
            <dd className="mt-0.5 font-mono text-gray-800">{job.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">来源类型</dt>
            <dd className="mt-0.5 text-gray-800">{job.source_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">风格</dt>
            <dd className="mt-0.5 text-gray-800">{job.style}</dd>
          </div>
          <div>
            <dt className="text-gray-500">创建时间</dt>
            <dd className="mt-0.5 text-gray-800">
              {new Date(job.created_at).toLocaleString("zh-CN")}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
