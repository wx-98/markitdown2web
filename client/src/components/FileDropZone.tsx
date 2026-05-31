import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFile, disabled }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFile(files[0]),
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
        p-10 transition-colors cursor-pointer
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 text-gray-400" />
      <p className="text-sm text-gray-600">
        {isDragActive
          ? "释放文件以上传"
          : "拖拽文件到此处，或点击选择文件"}
      </p>
      <p className="text-xs text-gray-400">
        支持 PDF、DOCX、PPTX、XLSX、HTML、CSV、JSON、图片、音频等格式
      </p>
    </div>
  );
}
