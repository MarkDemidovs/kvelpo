"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Segmented Light / Dark / System control. Pass `hideSystem` for a two-way toggle. */
export default function ThemeToggle({ hideSystem = false }: { hideSystem?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options = hideSystem ? OPTIONS.filter((option) => option.value !== "system") : OPTIONS;

  return (
    <div role="radiogroup" aria-label="Appearance" className="inline-flex rounded-full bg-dark-tertiary p-1">
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active ? "bg-dark-primary text-fg shadow-sm" : "text-fg-secondary hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
