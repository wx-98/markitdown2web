import { create } from "zustand";
import { getActiveTasks } from "@/api/tasks";
import { getActivePptxJobs } from "@/api/pptx";

export interface ActiveTask {
  taskId: string;
  type: "video" | "url" | "document" | "pptx";
  source: string;
  progress: number;
  status: string;
  detailPath: string;
}

interface TaskStore {
  activeTasks: ActiveTask[];
  lastSynced: number;
  addTask: (task: Omit<ActiveTask, "progress" | "status">) => void;
  updateTask: (taskId: string, updates: Partial<Pick<ActiveTask, "progress" | "status">>) => void;
  removeTask: (taskId: string) => void;
  syncFromServer: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  activeTasks: [],
  lastSynced: 0,

  addTask: (task) =>
    set((s) => {
      if (s.activeTasks.some((t) => t.taskId === task.taskId)) return s;
      return { activeTasks: [...s.activeTasks, { ...task, progress: 0, status: "pending" }] };
    }),

  updateTask: (taskId, updates) =>
    set((s) => ({
      activeTasks: s.activeTasks.map((t) =>
        t.taskId === taskId ? { ...t, ...updates } : t,
      ),
    })),

  removeTask: (taskId) =>
    set((s) => ({
      activeTasks: s.activeTasks.filter((t) => t.taskId !== taskId),
    })),

  syncFromServer: async () => {
    const now = Date.now();
    if (now - get().lastSynced < 5000) return;

    try {
      const [convTasks, pptxJobs] = await Promise.all([
        getActiveTasks().catch(() => []),
        getActivePptxJobs().catch(() => []),
      ]);

      const tasks: ActiveTask[] = [];

      for (const t of convTasks) {
        tasks.push({
          taskId: t.id,
          type: t.type as ActiveTask["type"],
          source: t.source || "任务",
          progress: t.progress,
          status: t.status,
          detailPath: `/task/${t.id}`,
        });
      }

      for (const j of pptxJobs) {
        tasks.push({
          taskId: j.id,
          type: "pptx",
          source: j.source_name || "PPTX",
          progress: j.progress,
          status: j.status,
          detailPath: `/pptx/job/${j.id}`,
        });
      }

      // Merge: keep local-only entries, update server-known ones
      const existing = get().activeTasks;
      const serverIds = new Set(tasks.map((t) => t.taskId));
      const localOnly = existing.filter(
        (t) => !serverIds.has(t.taskId) && (t.status === "pending" || t.status === "processing"),
      );

      set({ activeTasks: [...tasks, ...localOnly], lastSynced: now });
    } catch {
      // Silently fail
    }
  },
}));
