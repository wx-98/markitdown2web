import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Globe } from "lucide-react";
import NoteStyleSelect from "@/components/NoteStyleSelect";
import { processUrl } from "@/api/url";
import { useTaskStore } from "@/stores/taskStore";
import type { NoteStyle } from "@/types";

export default function UrlConverter() {
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addTask = useTaskStore((s) => s.addTask);

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("请输入网页链接");
      return;
    }
    setLoading(true);
    try {
      const result = await processUrl(url, style);
      addTask({ taskId: result.task_id, type: "url", source: url, detailPath: `/task/${result.task_id}` });
      toast.success("任务已提交！");
      navigate(`/task/${result.task_id}`);
    } catch (e: any) {
      toast.error(e.message || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Globe className="text-blue-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">URL 转笔记</h1>
          <p className="text-sm text-gray-500">
            输入任意网页链接，智能提取内容并生成学习笔记
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            网页链接
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            className="input"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            笔记风格
          </label>
          <NoteStyleSelect value={style} onChange={setStyle} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="btn-primary w-full"
        >
          {loading ? "提交中..." : "开始处理"}
        </button>
      </div>
    </div>
  );
}
