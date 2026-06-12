import { Link } from "react-router-dom";
import { ArrowRight, FileText, Globe, Video } from "lucide-react";

const FEATURES = [
  {
    to: "/video",
    icon: Video,
    color: "bg-purple-100 text-purple-600",
    title: "视频转笔记",
    desc: "支持 YouTube、Bilibili 及本地视频，通过帧提取 + 语音识别 + AI 分析，自动生成结构化学习笔记",
  },
  {
    to: "/url",
    icon: Globe,
    color: "bg-blue-100 text-blue-600",
    title: "URL 转笔记",
    desc: "输入任意网页链接，智能抓取正文内容并通过 AI 整理为清晰的 Markdown 笔记",
  },
  {
    to: "/document",
    icon: FileText,
    color: "bg-emerald-100 text-emerald-600",
    title: "文档转笔记",
    desc: "上传 PDF、Word、PPT、Excel 等文档，自动提取内容并生成学习笔记，支持多种导出格式",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img
            src="/icons/logo.svg"
            alt="E2M Logo"
            className="h-20 w-20 drop-shadow-lg"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Everything → Markdown
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          AI 驱动的一站式学习笔记生成平台。将视频、网页、文档智能转化为结构化的
          Markdown 学习笔记，支持导出为 Word、PDF 等格式。
        </p>
      </section>

      {/* Feature Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="card group flex flex-col justify-between"
          >
            <div>
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}
              >
                <f.icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-1">
              开始使用 <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          工作流程
        </h2>
        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "01", title: "输入内容", desc: "粘贴链接或上传文件" },
            { step: "02", title: "AI 提取", desc: "智能抓取与解析内容" },
            { step: "03", title: "生成笔记", desc: "LLM 总结结构化笔记" },
            { step: "04", title: "导出使用", desc: "Markdown / Word / PDF" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
