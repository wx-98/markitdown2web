import { useState } from "react";
import { FileText } from "lucide-react";
import { FileDropZone } from "../components/FileDropZone";
import { UrlInput } from "../components/UrlInput";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { useConvert } from "../hooks/useConvert";

type TabId = "file" | "url";

export function HomePage() {
  const [tab, setTab] = useState<TabId>("file");
  const { loading, error, result, handleFile, handleUrl, reset } = useConvert();

  if (result) {
    return (
      <Layout>
        <MarkdownPreview result={result} onReset={reset} />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>
          文件上传
        </TabButton>
        <TabButton active={tab === "url"} onClick={() => setTab("url")}>
          URL 转换
        </TabButton>
      </div>

      {tab === "file" ? (
        <FileDropZone onFile={handleFile} disabled={loading} />
      ) : (
        <UrlInput onSubmit={handleUrl} disabled={loading} />
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorAlert message={error} />}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">MarkItDown Web</h1>
          </div>
          <p className="text-gray-500">
            将文档、网页、图片等转换为 Markdown —— 基于 Microsoft MarkItDown
          </p>
        </header>

        {/* main card */}
        <main className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {children}
        </main>

        {/* footer */}
        <footer className="mt-8 text-center text-xs text-gray-400">
          支持 PDF / DOCX / PPTX / XLSX / HTML / CSV / JSON / 图片 / 音频 等 20+ 种格式
        </footer>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
        ${active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
    >
      {children}
    </button>
  );
}
