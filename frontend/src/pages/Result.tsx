import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardCopy,
  Download,
  FileDown,
  FileText,
  Loader2,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { exportResult, getResult } from "@/api/tasks";
import type { ConversionResult } from "@/types";

export default function Result() {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!resultId) return;
    getResult(resultId)
      .then(setResult)
      .catch(() => toast.error("无法加载结果"))
      .finally(() => setLoading(false));
  }, [resultId]);

  const handleExport = async (format: "markdown" | "word" | "pdf") => {
    if (!resultId) return;
    setExporting(format);
    try {
      const blob = await exportResult(resultId, format);
      const ext = { markdown: "md", word: "docx", pdf: "pdf" }[format];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result?.title || "notes"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出成功！");
    } catch {
      toast.error("导出失败");
    } finally {
      setExporting(null);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.markdown_content);
    toast.success("已复制到剪贴板");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-20 text-center text-gray-500">结果不存在或已过期</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{result.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            来源：{result.source_type} · {result.source_url}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn-secondary text-xs">
            <ClipboardCopy size={14} /> 复制
          </button>
          <button
            onClick={() => handleExport("markdown")}
            disabled={!!exporting}
            className="btn-secondary text-xs"
          >
            <Download size={14} /> .md
          </button>
          <button
            onClick={() => handleExport("word")}
            disabled={!!exporting}
            className="btn-secondary text-xs"
          >
            <FileText size={14} /> .docx
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="btn-primary text-xs"
          >
            <FileDown size={14} />
            {exporting === "pdf" ? "导出中..." : ".pdf"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setShowRaw(false)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !showRaw ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          学习笔记
        </button>
        <button
          onClick={() => setShowRaw(true)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showRaw ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          原始提取内容
        </button>
      </div>

      {/* Content */}
      <div className="card">
        <MarkdownRenderer
          content={showRaw ? result.raw_content : result.markdown_content}
        />
      </div>
    </div>
  );
}
