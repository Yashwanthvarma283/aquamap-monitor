import { useSyncExternalStore } from "react";
export interface EditorSettings {
  suggestions: boolean; liveTemplates: boolean; keymap: boolean;
  lineNumbers: boolean; highlightLine: boolean; fontSize: "13" | "14" | "16";
}
export const DEFAULT_SETTINGS: EditorSettings = { suggestions: true, liveTemplates: true, keymap: true, lineNumbers: true, highlightLine: true, fontSize: "14" };
const KEY = "aquamap-editor-settings";
let cache: EditorSettings | null = null;
const listeners = new Set<() => void>();
function read(): EditorSettings {
  if (cache) return cache;
  try { cache = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { cache = DEFAULT_SETTINGS; }
  return cache!;
}
export function updateSettings(patch: Partial<EditorSettings> | null) {
  cache = patch ? { ...read(), ...patch } : DEFAULT_SETTINGS;
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}
export function useSettings() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => DEFAULT_SETTINGS);
}
