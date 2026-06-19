import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const stored = (localStorage.getItem("theme") as Theme) || "system";
applyTheme(stored);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const current = (localStorage.getItem("theme") as Theme) || "system";
  if (current === "system") applyTheme("system");
});

export const useThemeStore = create<ThemeState>((set) => ({
  theme: stored,
  setTheme: (t) => {
    localStorage.setItem("theme", t);
    applyTheme(t);
    set({ theme: t });
  },
}));
