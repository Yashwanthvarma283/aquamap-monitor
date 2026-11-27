import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/analytics";
import { LIVE_TEMPLATES } from "@/lib/sampleScript";
import { useSettings, updateSettings, type EditorSettings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("Settings", "Configure the AquaMap sample editor: code completion, IntelliJ live templates, keymap and appearance."),
  component: SettingsPage,
});

const SHORTCUTS = [
  ["Ctrl + Space", "Show suggestions"], ["Ctrl + D", "Duplicate line"], ["Ctrl + Y", "Delete line"],
  ["Ctrl + /", "Toggle line comment"], ["Ctrl + Alt + L", "Reformat code"], ["Alt + Shift + ↑ / ↓", "Move line up / down"],
  ["Shift + Enter", "Start new line below"], ["Tab", "Expand live template"],
] as const;

type Toggle = { key: keyof EditorSettings; label: string; hint: string };
const SECTIONS: { title: string; toggles: Toggle[]; extra?: "shortcuts" | "templates" | "font" }[] = [
  { title: "Appearance", extra: "font", toggles: [
    { key: "highlightLine", label: "Highlight current line", hint: "Tint the line holding the caret." },
    { key: "lineNumbers", label: "Line numbers", hint: "Show the gutter with line numbers." } ] },
  { title: "Code completion", toggles: [{ key: "suggestions", label: "Keyword suggestions while typing", hint: "Pop up parameters, keywords and templates as you type." }] },
  { title: "Keymap", extra: "shortcuts", toggles: [{ key: "keymap", label: "IntelliJ IDEA keymap", hint: "Enable the editing shortcuts listed below." }] },
  { title: "Live templates", extra: "templates", toggles: [{ key: "liveTemplates", label: "Expand abbreviations with Tab", hint: "Type an abbreviation such as sout and press Tab." }] },
];

function SettingsPage() {
  const s = useSettings();
  const [q, setQ] = useState("");
  const match = (t: string) => t.toLowerCase().includes(q.toLowerCase());
  const visible = SECTIONS.filter((sec) => match(sec.title) || sec.toggles.some((t) => match(t.label + t.hint)));
  return (
    <main className="content-page">
      <div className="page-title-row">
        <div><div className="eyebrow">PREFERENCES</div><h1>Settings<span className="title-dot">.</span></h1><p>Tune the Sample lab editor to work the way you do.</p></div>
        <Button variant="outline" onClick={() => updateSettings(null)}><RotateCcw />Restore defaults</Button>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <div className="search-field"><Search className="size-4" /><Input aria-label="Search settings" placeholder="Search settings…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {visible.map((sec) => <a key={sec.title} href={`#${sec.title.replace(/\s/g, "-")}`}>{sec.title}</a>)}
        </nav>
        <div className="settings-sections">
          {visible.map((sec) => (
            <section key={sec.title} id={sec.title.replace(/\s/g, "-")} className="settings-card">
              <h2>{sec.title}</h2>
              {sec.toggles.map((t) => (
                <label key={t.key} className="settings-row">
                  <span><strong>{t.label}</strong><small>{t.hint}</small></span>
                  <Switch checked={s[t.key] as boolean} onCheckedChange={(v) => updateSettings({ [t.key]: v })} aria-label={t.label} />
                </label>
              ))}
              {sec.extra === "font" && (
                <div className="settings-row"><span><strong>Editor font size</strong><small>Monospace size in pixels.</small></span>
                  <div className="segmented">{(["13", "14", "16"] as const).map((f) => <Button key={f} size="sm" variant={s.fontSize === f ? "default" : "ghost"} onClick={() => updateSettings({ fontSize: f })}>{f}</Button>)}</div>
                </div>
              )}
              {sec.extra === "shortcuts" && (
                <div className={`settings-ref ${s.keymap ? "" : "disabled"}`}>{SHORTCUTS.map(([k, d]) => <div key={k}><span>{d}</span><kbd>{k}</kbd></div>)}</div>
              )}
              {sec.extra === "templates" && (
                <div className={`settings-ref ${s.liveTemplates ? "" : "disabled"}`}>{LIVE_TEMPLATES.map((t) => <div key={t.abbr}><span>{t.description}</span><kbd>{t.abbr}</kbd></div>)}</div>
              )}
            </section>
          ))}
          {!visible.length && <div className="empty-state">No settings match “{q}”.</div>}
        </div>
      </div>
    </main>
  );
}
