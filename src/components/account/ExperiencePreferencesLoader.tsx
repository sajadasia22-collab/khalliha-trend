"use client";

import { useEffect } from "react";

export type ExperienceTheme = "system" | "light" | "dark";
export type ExperienceDensity = "comfortable" | "compact";

export const EXPERIENCE_STORAGE_KEY = "khalliha:experience-preferences";

export type ExperiencePreferences = {
  theme: ExperienceTheme;
  density: ExperienceDensity;
  reduceMotion: boolean;
};

export const defaultExperiencePreferences: ExperiencePreferences = {
  theme: "system",
  density: "comfortable",
  reduceMotion: false,
};

export function readExperiencePreferences(): ExperiencePreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(EXPERIENCE_STORAGE_KEY) ?? "{}");
    return {
      theme: ["system", "light", "dark"].includes(stored.theme) ? stored.theme : "system",
      density: stored.density === "compact" ? "compact" : "comfortable",
      reduceMotion: stored.reduceMotion === true,
    };
  } catch {
    return defaultExperiencePreferences;
  }
}

export function applyExperiencePreferences(preferences: ExperiencePreferences) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark =
    preferences.theme === "dark" || (preferences.theme === "system" && systemDark);
  if (useDark) root.dataset.theme = "dark";
  else delete root.dataset.theme;
  root.dataset.density = preferences.density;
  root.dataset.reduceMotion = preferences.reduceMotion ? "true" : "false";
}

export function ExperiencePreferencesLoader() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyExperiencePreferences(readExperiencePreferences());
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return null;
}
