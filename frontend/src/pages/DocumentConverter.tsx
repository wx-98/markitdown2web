import { useState } from "react";
import toast from "react-hot-toast";
import { FileText, Sparkles } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import NoteStyleSelect from "@/components/NoteStyleSelect";
import TaskProgress from "@/components/TaskProgress";
import { convertDocument, getDocumentStatus } from "@/api/document";
import type { NoteStyle } from "@/types";

const ACCEPT =
  ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.epub,.html,.htm,.txt,.md,.json,.xml";

export default function DocumentConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [useVlm, setUseVlm] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  const handleSubmit = async () => {
    if (!file) {
      toast.error("请选择文件");
      return;
    }
    setLoading(true);
    try {
      const result = await convertDocument(file, style, useVlm && isPdf);
      setTaskId(result.task_id);
      toast.success("任务已提交！");
    } catch (e: any) {
      toast.error(e.message || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="text-emerald-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文档转笔记</h1>
          <p className="text-sm text-gray-500">
            支持 PDF、Word、PPT、Excel 等多种格式
          </p>
        </div>
      </div>

      {!taskId ? (
        <div className="space-y-6">
          <FileUpload
            accept={ACCEPT}
            onFile={setFile}
            label="拖拽文档到此处，或点击选择（支持 PDF、Word、PPT、Excel 等）"
          />

          {/* VLM Enhancement Toggle - only for PDF */}
          {isPdf && (
            <div
              onClick={() => setUseVlm(!useVlm)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                useVlm
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  useVlm
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {useVlm && (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    VLM 增强模式（论文推荐）
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  将 PDF 每页渲染为图片，通过视觉语言模型（VLM）精确识别数学公式、图表和复杂排版。
                  适合学术论文、含公式的技术文档。处理时间较长，但公式和图表提取更准确。
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              笔记风格
            </label>
            <NoteStyleSelect value={style} onChange={setStyle} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="btn-primary w-full"
          >
            {loading ? "提交中..." : "开始转换"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TaskProgress taskId={taskId} pollFn={getDocumentStatus} />
          <button
            onClick={() => {
              setTaskId(null);
              setFile(null);
            }}
            className="btn-secondary w-full"
          >
            转换新文档
          </button>
        </div>
      )}
    </div>
  );
}
