import { create } from "zustand";

interface AuthState {
  token: string | null;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((_set, get) => ({
  token: localStorage.getItem("access_token"),
  isLoggedIn: () => !!get().token,
}));
