import { useState } from "react";
import toast from "react-hot-toast";
import { Video } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import NoteStyleSelect from "@/components/NoteStyleSelect";
import TaskProgress from "@/components/TaskProgress";
import { processVideoFile, processVideoUrl, getVideoStatus } from "@/api/video";
import type { NoteStyle } from "@/types";

export default function VideoConverter() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<NoteStyle>("detailed");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url && !file) {
      toast.error("请输入视频链接或上传视频文件");
      return;
    }
    setLoading(true);
    try {
      const result = file
        ? await processVideoFile(file, style)
        : await processVideoUrl(url, style);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Video className="text-purple-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">视频转笔记</h1>
          <p className="text-sm text-gray-500">
            支持 YouTube、Bilibili 链接或本地视频文件
          </p>
        </div>
      </div>

      {!taskId ? (
        <div className="space-y-6">
          {/* URL Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              视频链接
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/..."
              className="input"
              disabled={!!file}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">或者</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* File Upload */}
          <FileUpload
            accept="video/*"
            onFile={(f) => {
              setFile(f);
              setUrl("");
            }}
            label="拖拽视频文件到此处，或点击选择"
          />

          {/* Note Style */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              笔记风格
            </label>
            <NoteStyleSelect value={style} onChange={setStyle} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!url && !file)}
            className="btn-primary w-full"
          >
            {loading ? "提交中..." : "开始处理"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TaskProgress taskId={taskId} pollFn={getVideoStatus} />
          <button
            onClick={() => {
              setTaskId(null);
              setUrl("");
              setFile(null);
            }}
            className="btn-secondary w-full"
          >
            处理新视频
          </button>
        </div>
      )}
    </div>
  );
}
