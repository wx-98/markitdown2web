import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  accept?: string;
  onFile: (file: File) => void;
  label?: string;
}

export default function FileUpload({
  accept,
  onFile,
  label = "拖拽文件到此处，或点击选择文件",
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        onFile(file);
      }
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onFile(file);
      }
    },
    [onFile],
  );

  const clear = () => setFileName(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${
        dragOver
          ? "border-primary-400 bg-primary-50"
          : "border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30"
      }`}
    >
      <Upload className="mb-3 text-gray-400" size={36} />
      {fileName ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{fileName}</span>
          <button onClick={clear} className="text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{label}</p>
      )}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}
