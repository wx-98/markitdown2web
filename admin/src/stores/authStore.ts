import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (t: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("admin_token"),
  setToken: (t) => {
    localStorage.setItem("admin_token", t);
    set({ token: t });
  },
  logout: () => {
    localStorage.removeItem("admin_token");
    set({ token: null });
  },
}));
