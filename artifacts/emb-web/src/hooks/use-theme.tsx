import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("emb_theme") as Theme) || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem("emb_theme", newTheme);
    } catch {}
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}
