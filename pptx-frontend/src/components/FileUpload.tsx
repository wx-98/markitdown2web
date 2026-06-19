import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface Props {
  onFile: (file: File | null) => void;
  accept?: string;
}

const ALLOWED = ".pdf,.docx,.pptx,.txt,.md";

export default function FileUpload({ onFile, accept = ALLOWED }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (f: File | null) => {
      setFile(f);
      onFile(f);
    },
    [onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
        dragOver
          ? "border-primary-400 bg-primary-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {file ? (
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-primary-600" />
          <span className="text-sm font-medium text-gray-700">{file.name}</span>
          <button
            onClick={() => handleFile(null)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <Upload size={32} className="mb-3 text-gray-400" />
          <p className="mb-1 text-sm font-medium text-gray-600">
            拖拽文件到此处或{" "}
            <label className="cursor-pointer text-primary-600 hover:underline">
              点击上传
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  handleFile(f);
                }}
              />
            </label>
          </p>
          <p className="text-xs text-gray-400">支持 PDF、DOCX、PPTX、TXT、Markdown</p>
        </>
      )}
    </div>
  );
}
