import { Link } from "react-router-dom";
import { ArrowRight, FileText, Globe, Presentation, Sparkles, Video } from "lucide-react";

const NOTE_FEATURES = [
  {
    to: "/video",
    icon: Video,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    title: "视频转笔记",
    desc: "支持 YouTube、Bilibili 及本地视频，通过帧提取 + 语音识别 + AI 分析，自动生成结构化学习笔记",
  },
  {
    to: "/url",
    icon: Globe,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    title: "URL 转笔记",
    desc: "输入任意网页链接，智能抓取正文内容并通过 AI 整理为清晰的 Markdown 笔记",
  },
  {
    to: "/document",
    icon: FileText,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    title: "文档转笔记",
    desc: "上传 PDF、Word、PPT、Excel 等文档，自动提取内容并生成学习笔记，支持多种导出格式",
  },
];

const PPTX_FEATURES = [
  {
    to: "/pptx",
    icon: Presentation,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    title: "AI 生成 PPTX",
    desc: "输入文本、上传文档或粘贴链接，AI 自动规划设计并生成专业演示文稿，支持多种风格模板",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img src="/icons/logo.svg" alt="E2M Logo" className="h-20 w-20 drop-shadow-lg" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Everything → Markdown & PPTX
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          AI 驱动的一站式内容转换平台。将视频、网页、文档智能转化为结构化 Markdown
          学习笔记或专业演示文稿。
        </p>
      </section>

      {/* Everything 转笔记 */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
            <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Everything 转笔记</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {NOTE_FEATURES.map((f) => (
            <Link key={f.to} to={f.to} className="card group flex flex-col justify-between dark:border-gray-700 dark:bg-gray-800">
              <div>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-1 dark:text-primary-400">
                开始使用 <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Everything 转 PPTX */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Presentation size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Everything 转 PPTX</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PPTX_FEATURES.map((f) => (
            <Link key={f.to} to={f.to} className="card group flex flex-col justify-between md:col-span-2 dark:border-gray-700 dark:bg-gray-800">
              <div>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-1 dark:text-primary-400">
                开始使用 <ArrowRight size={16} />
              </div>
            </Link>
          ))}
          <Link
            to="/pptx/history"
            className="card group flex flex-col items-center justify-center text-center dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              <FileText size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">PPTX 历史任务</h3>
            <p className="mt-1 text-xs text-gray-400">查看已创建的 PPTX 任务</p>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">工作流程</h2>
        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "01", title: "输入内容", desc: "粘贴链接、上传文件或输入文本" },
            { step: "02", title: "AI 提取", desc: "智能抓取、解析与分析内容" },
            { step: "03", title: "生成产出", desc: "Markdown 笔记 或 PPTX 演示文稿" },
            { step: "04", title: "导出使用", desc: "Markdown / Word / PDF / PPTX" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
