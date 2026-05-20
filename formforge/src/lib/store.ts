import { create } from "zustand";
import { AppState, User } from "../types";

interface AuthState extends AppState {
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthScope = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
