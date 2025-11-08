import { create } from "zustand";

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  borderRadius: string;
}

interface ThemeStore {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  saveTheme: (tenantId: string) => Promise<void>;
  loadTheme: (tenantId: string) => Promise<void>;
}

const defaultTheme: ThemeConfig = {
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#3b82f6",
  fontFamily: "Inter",
  borderRadius: "0.5rem",
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: defaultTheme,

  setTheme: (newTheme) =>
    set((state) => ({
      theme: { ...state.theme, ...newTheme },
    })),

  resetTheme: () => set({ theme: defaultTheme }),

  saveTheme: async (tenantId: string) => {
    const { theme } = get();
    try {
      const response = await fetch(`/api/tenants/${tenantId}/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        throw new Error("Failed to save theme");
      }

      console.log("Theme saved successfully");
    } catch (error) {
      console.error("Error saving theme:", error);
      throw error;
    }
  },

  loadTheme: async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (!response.ok) {
        throw new Error("Failed to load theme");
      }

      const data = await response.json();
      if (data.theme) {
        set({ theme: data.theme });
      }
    } catch (error) {
      console.error("Error loading theme:", error);
      throw error;
    }
  },
}));
