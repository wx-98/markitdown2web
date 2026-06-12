import { useState } from "react";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
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
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("请选择文件");
      return;
    }
    setLoading(true);
    try {
      const result = await convertDocument(file, style);
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
