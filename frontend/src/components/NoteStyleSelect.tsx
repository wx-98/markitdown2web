import type { NoteStyle } from "@/types";

interface Props {
  value: NoteStyle;
  onChange: (v: NoteStyle) => void;
}

const OPTIONS: { value: NoteStyle; label: string; desc: string }[] = [
  { value: "detailed", label: "详细笔记", desc: "完整的结构化学习笔记" },
  { value: "brief", label: "简要总结", desc: "核心要点速览" },
  { value: "outline", label: "大纲模式", desc: "层级清晰的知识大纲" },
];

export default function NoteStyleSelect({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border-2 p-3 text-left transition-all ${
            value === opt.value
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="text-sm font-medium text-gray-900">{opt.label}</div>
          <div className="mt-0.5 text-xs text-gray-500">{opt.desc}</div>
        </button>
      ))}
    </div>
  );
}
