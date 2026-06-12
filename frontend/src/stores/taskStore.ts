import { create } from "zustand";
import type { TaskStatus } from "@/types";

interface ActiveTask {
  taskId: string;
  type: "video" | "url" | "document";
  source: string;
  status: TaskStatus | null;
}

interface TaskStore {
  activeTasks: ActiveTask[];
  addTask: (task: Omit<ActiveTask, "status">) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  removeTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  activeTasks: [],

  addTask: (task) =>
    set((s) => ({
      activeTasks: [...s.activeTasks, { ...task, status: null }],
    })),

  updateTaskStatus: (taskId, status) =>
    set((s) => ({
      activeTasks: s.activeTasks.map((t) =>
        t.taskId === taskId ? { ...t, status } : t,
      ),
    })),

  removeTask: (taskId) =>
    set((s) => ({
      activeTasks: s.activeTasks.filter((t) => t.taskId !== taskId),
    })),
}));
