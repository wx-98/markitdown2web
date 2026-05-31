import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { ConvertResponse } from "../types/convert";

interface Props {
  result: ConvertResponse;
  onReset: () => void;
}

export function MarkdownPreview({ result, onReset }: Props) {
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {result.title || result.source}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewRaw((v) => !v)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium
                       text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {viewRaw ? "预览" : "源码"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3
                       py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3
                       py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重新转换
          </button>
        </div>
      </div>

      {/* content */}
      <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {viewRaw ? (
          <pre className="whitespace-pre-wrap break-words text-sm font-mono text-gray-800">
            {result.markdown}
          </pre>
        ) : (
          <article className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-a:text-blue-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.markdown}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
