import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Presentation, Sparkles, Globe, FileText, Upload, X } from "lucide-react";
import { createPptxJob } from "@/api/pptx";
import { useTaskStore } from "@/stores/taskStore";

type SourceTab = "text" | "file" | "url";

const VALID_TABS: SourceTab[] = ["text", "file", "url"];

const TAB_TITLES: Record<SourceTab, string> = {
  text: "文本输入",
  file: "文件上传",
  url: "URL 导入",
};

const TAB_DESCRIPTIONS: Record<SourceTab, string> = {
  text: "输入或粘贴文本内容，AI 自动生成专业演示文稿",
  file: "上传文档文件，AI 自动提取内容并生成演示文稿",
  url: "粘贴网页链接，AI 自动抓取内容并生成演示文稿",
};

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

export default function PptxCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get("source") as SourceTab | null;
  const initialTab = sourceParam && VALID_TABS.includes(sourceParam) ? sourceParam : "text";
  const [tab, setTab] = useState<SourceTab>(initialTab);

  useEffect(() => {
    if (sourceParam && VALID_TABS.includes(sourceParam)) {
      setTab(sourceParam);
    }
  }, [sourceParam]);

  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [canvasFormat, setCanvasFormat] = useState("ppt169");
  const [style, setStyle] = useState("professional");
  const [pageCount, setPageCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const addTask = useTaskStore((s) => s.addTask);

  const handleSubmit = async () => {
    let finalContent = "";
    let sourceType: "text" | "file" | "url" = "text";
    let sourceName = "";

    if (tab === "text") {
      if (!content.trim()) { toast.error("请输入内容"); return; }
      finalContent = content;
    } else if (tab === "url") {
      if (!url.trim()) { toast.error("请输入 URL"); return; }
      finalContent = url;
      sourceType = "url";
      sourceName = url;
    } else {
      if (!file) { toast.error("请上传文件"); return; }
      sourceType = "file";
      sourceName = file.name;
    }

    setLoading(true);
    try {
      const job = await createPptxJob({
        content: finalContent,
        source_type: sourceType,
        source_name: sourceName,
        canvas_format: canvasFormat,
        style,
        page_count: pageCount,
        file: file ?? undefined,
      });
      addTask({ taskId: job.id, type: "pptx", source: sourceName || "PPTX", detailPath: `/pptx/job/${job.id}` });
      toast.success("任务创建成功");
      navigate(`/pptx/job/${job.id}`);
    } catch (err: any) {
      toast.error(err.message || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header — dynamic based on tab */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
          <Presentation size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Everything 转 PPTX — {TAB_TITLES[tab]}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{TAB_DESCRIPTIONS[tab]}</p>
      </div>

      {/* Input area — directly shows for current tab, no tab bar */}
      <div className="card dark:border-gray-700 dark:bg-gray-800">
        {tab === "text" && (
          <textarea
            className="input min-h-[180px] resize-y dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={"在此输入或粘贴你的内容…\n支持 Markdown 格式"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}

        {tab === "file" && (
          <div
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
              dragOver
                ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-primary-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mb-3 text-gray-400" />
                <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  拖拽文件到此处或{" "}
                  <label className="cursor-pointer text-primary-600 hover:underline">
                    点击上传
                    <input
                      type="file"
                      accept=".pdf,.docx,.pptx,.txt,.md"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-400">支持 PDF、DOCX、PPTX、TXT、Markdown</p>
              </>
            )}
          </div>
        )}

        {tab === "url" && (
          <input
            className="input dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
      </div>

      {/* Options */}
      <div className="card dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">生成选项</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">画布格式</label>
            <select className="input dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={canvasFormat} onChange={(e) => setCanvasFormat(e.target.value)}>
              {CANVAS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">风格模板</label>
            <select className="input dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
