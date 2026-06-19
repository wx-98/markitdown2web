import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { PptxJob } from "@/types";

const STAGES = [
  { key: "pending", label: "排队中" },
  { key: "planning", label: "规划设计" },
  { key: "generating", label: "生成幻灯片" },
  { key: "exporting", label: "导出 PPTX" },
  { key: "completed", label: "完成" },
] as const;

function stageIndex(status: string) {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function JobProgress({ job }: { job: PptxJob }) {
  const current = stageIndex(job.status);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>
      <p className="text-center text-sm text-gray-500">{job.progress}%</p>

      {/* Stage indicators */}
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const done = i < current || job.status === "completed";
          const active = i === current && job.status !== "completed" && job.status !== "failed";
          return (
            <div key={stage.key} className="flex flex-col items-center gap-1.5">
              {done ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : active ? (
                <Loader2 size={20} className="animate-spin text-primary-600" />
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
              <span
                className={`text-xs font-medium ${
                  done ? "text-green-600" : active ? "text-primary-600" : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
