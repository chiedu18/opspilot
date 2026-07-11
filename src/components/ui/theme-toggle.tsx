"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const readDocumentTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(readDocumentTheme());
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, {
      attributeFilter: ["data-theme"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  const activeTheme = theme ?? "light";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";

  const toggleTheme = () => {
    const currentTheme = readDocumentTheme();
    const next = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("opspilot-theme", next);
    setTheme(next);
  };

  return (
    <button
      aria-label={
        theme ? `Switch to ${nextTheme} mode` : "Switch color theme"
      }
      aria-pressed={activeTheme === "dark"}
      className="op-theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span aria-hidden="true">
        {theme === null ? "Theme" : activeTheme === "dark" ? "Light" : "Dark"}
      </span>
      <span aria-hidden="true" className="op-theme-toggle-orb" />
    </button>
  );
}
