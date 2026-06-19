import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Presentation, Sparkles, Globe, FileText, Type } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { createJob } from "@/api/pptx";

type SourceTab = "text" | "file" | "url";

const CANVAS_OPTIONS = [
  { value: "ppt169", label: "16:9 宽屏" },
  { value: "ppt43", label: "4:3 标准" },
];

const STYLE_OPTIONS = [
  { value: "professional", label: "专业商务" },
  { value: "creative", label: "创意活力" },
  { value: "minimal", label: "简约极简" },
  { value: "academic", label: "学术报告" },
];

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SourceTab>("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [canvasFormat, setCanvasFormat] = useState("ppt169");
  const [style, setStyle] = useState("professional");
  const [pageCount, setPageCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    let finalContent = "";
    let sourceType: "text" | "file" | "url" = "text";
    let sourceName = "";

    if (tab === "text") {
      if (!content.trim()) {
        toast.error("请输入内容");
        return;
      }
      finalContent = content;
      sourceType = "text";
    } else if (tab === "url") {
      if (!url.trim()) {
        toast.error("请输入 URL");
        return;
      }
      finalContent = url;
      sourceType = "url";
      sourceName = url;
    } else if (tab === "file") {
      if (!file) {
        toast.error("请上传文件");
        return;
      }
      sourceType = "file";
      sourceName = file.name;
    }

    setLoading(true);
    try {
      const job = await createJob({
        content: finalContent,
        source_type: sourceType,
        source_name: sourceName,
        canvas_format: canvasFormat,
        style,
        page_count: pageCount,
        file: file ?? undefined,
      });
      toast.success("任务创建成功");
      navigate(`/job/${job.id}`);
    } catch (err: any) {
      toast.error(err.message || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const tabCls = (t: SourceTab) =>
    `flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      tab === t
        ? "bg-primary-600 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
          <Presentation size={32} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Everything 转 PPTX</h1>
        <p className="mt-2 text-gray-500">输入内容、上传文档或粘贴链接，AI 自动生成专业演示文稿</p>
      </div>

      {/* Source tabs */}
      <div className="card">
        <div className="mb-5 flex gap-2 rounded-xl bg-gray-100 p-1">
          <button onClick={() => setTab("text")} className={tabCls("text")}>
            <Type size={16} /> 文本输入
          </button>
          <button onClick={() => setTab("file")} className={tabCls("file")}>
            <FileText size={16} /> 文件上传
          </button>
          <button onClick={() => setTab("url")} className={tabCls("url")}>
            <Globe size={16} /> URL 导入
          </button>
        </div>

        {tab === "text" && (
          <textarea
            className="input min-h-[180px] resize-y"
            placeholder="在此输入或粘贴你的内容…&#10;支持 Markdown 格式"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}

        {tab === "file" && <FileUpload onFile={setFile} />}

        {tab === "url" && (
          <input
            className="input"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
      </div>

      {/* Options */}
      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-gray-900">生成选项</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Canvas format */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">画布格式</label>
            <select
              className="input"
              value={canvasFormat}
              onChange={(e) => setCanvasFormat(e.target.value)}
            >
              {CANVAS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">风格模板</label>
            <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Page count */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              目标页数 ({pageCount})
            </label>
            <input
              type="range"
              min={3}
              max={30}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              className="mt-2 w-full accent-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-4 text-base">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            创建中…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={18} />
            开始生成 PPTX
          </span>
        )}
      </button>
    </div>
  );
}
