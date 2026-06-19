import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Download, AlertCircle, Loader2, FileText, Presentation } from "lucide-react";
import { listPptxJobs, getPptxDownloadUrl } from "@/api/pptx";
import type { PptxJob } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "排队中", color: "bg-gray-100 text-gray-600" },
  planning: { label: "规划中", color: "bg-blue-100 text-blue-700" },
  generating: { label: "生成中", color: "bg-amber-100 text-amber-700" },
  exporting: { label: "导出中", color: "bg-purple-100 text-purple-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  failed: { label: "失败", color: "bg-red-100 text-red-700" },
};

export default function PptxHistory() {
  const [jobs, setJobs] = useState<PptxJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPptxJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">加载中…</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Presentation size={48} className="text-gray-300" />
        <p className="text-lg font-medium text-gray-500">暂无 PPTX 任务</p>
        <Link to="/pptx" className="btn-primary">
          开始创建
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">PPTX 历史任务</h1>

      <div className="space-y-3">
        {jobs.map((job) => {
          const st = STATUS_MAP[job.status] || STATUS_MAP.pending;
          return (
            <Link
              key={job.id}
              to={`/pptx/job/${job.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {job.source_name || "文本输入"}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(job.created_at).toLocaleString("zh-CN")}
                  </span>
                  <span>{job.canvas_format === "ppt169" ? "16:9" : "4:3"}</span>
                  <span>{job.page_count} 页</span>
                </div>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>
                {st.label}
              </span>

              {job.status === "completed" && (
                <a
                  href={getPptxDownloadUrl(job.id)}
                  onClick={(e) => e.stopPropagation()}
                  download
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                >
                  <Download size={18} />
                </a>
              )}

              {job.status === "failed" && (
                <AlertCircle size={18} className="text-red-400" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
