import { useState, type FormEvent } from "react";
import { Globe } from "lucide-react";

interface Props {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInput({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入 URL 地址，例如 https://example.com"
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm
                     placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        转换
      </button>
    </form>
  );
}
