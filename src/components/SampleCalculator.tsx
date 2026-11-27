import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { RotateCcw, TerminalSquare, Settings2, CircleAlert, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { gradeWQI } from "@/lib/water";
import { LIVE_TEMPLATES, runScript, suggestionsFor, KEYS } from "@/lib/sampleScript";
import { useSettings } from "@/lib/settings";

const INITIAL = "// Adyar River sample — edit values, type `sout` + Tab\nph = 7.4\ndo = 6\nbod = 2.5\ntds = 300\nturbidity = 4\nnitrate = 10\nprint wqi, grade";
const LINE_H = 24;
const PAD = 14;

function highlight(line: string) {
  const parts: { t: string; c?: string }[] = [];
  const re = /(\/\/.*$)|\b(print)\b|\b(wqi|grade|breaches)\b|\b([a-z_]+)\b|(-?\d*\.?\d+)|(=|,)/gi;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index > last) parts.push({ t: line.slice(last, m.index) });
    const c = m[1] ? "tok-comment" : m[2] ? "tok-keyword" : m[3] ? "tok-value" : m[4] ? (KEYS.includes(m[4].toLowerCase() as never) ? "tok-param" : "tok-unknown") : m[5] ? "tok-number" : "tok-op";
    parts.push({ t: m[0], c });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ t: line.slice(last) });
  return parts;
}

export function SampleCalculator() {
  const settings = useSettings();
  const [code, setCode] = useState(INITIAL);
  const [caret, setCaret] = useState(0);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [popup, setPopup] = useState({ open: false, index: 0 });
  const ta = useRef<HTMLTextAreaElement>(null);
  const result = useMemo(() => runScript(code), [code]);
  const lines = code.split("\n");
  const before = code.slice(0, caret);
  const caretLine = before.split("\n").length - 1;
  const caretCol = before.length - before.lastIndexOf("\n") - 1;
  const prefix = /[a-z_]+$/i.exec(before)?.[0] ?? "";
  const items = settings.suggestions && popup.open ? suggestionsFor(prefix, settings.liveTemplates) : [];
  const errorLines = new Set(result.errors.map((e) => e.line));
  const font = Number(settings.fontSize);

  const apply = (next: string, pos: number) => {
    setCode(next);
    setCaret(pos);
    requestAnimationFrame(() => { ta.current?.setSelectionRange(pos, pos); });
  };
  const replaceWord = (word: string, insert: string) => {
    const start = caret - word.length;
    const cursor = insert.indexOf("$0");
    const text = insert.replace("$0", "");
    apply(code.slice(0, start) + text + code.slice(caret), start + (cursor < 0 ? text.length : cursor));
    setPopup({ open: false, index: 0 });
  };
  const accept = (label: string) => {
    const tpl = settings.liveTemplates ? LIVE_TEMPLATES.find((t) => t.abbr === label) : undefined;
    replaceWord(prefix, tpl ? tpl.body : label === "print" ? "print $0" : KEYS.includes(label as never) ? `${label} = $0` : label);
  };
  const lineBounds = (pos: number) => {
    const s = code.lastIndexOf("\n", pos - 1) + 1;
    const e = code.indexOf("\n", pos);
    return [s, e < 0 ? code.length : e] as const;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (items.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        return setPopup({ open: true, index: (popup.index + d + items.length) % items.length });
      }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); return accept(items[popup.index]!.label); }
      if (e.key === "Escape") { e.preventDefault(); return setPopup({ open: false, index: 0 }); }
    }
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const tpl = settings.liveTemplates && LIVE_TEMPLATES.find((t) => t.abbr === prefix);
      if (tpl) return replaceWord(prefix, tpl.body);
      return apply(code.slice(0, caret) + "  " + code.slice(caret), caret + 2);
    }
    if (mod && e.key === " " && settings.suggestions) { e.preventDefault(); return setPopup({ open: true, index: 0 }); }
    if (!settings.keymap) return;
    const [s, en] = lineBounds(caret);
    const cur = code.slice(s, en);
    if (mod && !e.altKey && e.key.toLowerCase() === "d") { e.preventDefault(); return apply(code.slice(0, en) + "\n" + cur + code.slice(en), caret + cur.length + 1); }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); const rest = code.slice(0, s) + code.slice(Math.min(en + 1, code.length)); return apply(s > 0 && en >= code.length ? rest.slice(0, -1) : rest, Math.min(s, rest.length)); }
    if (mod && e.key === "/") {
      e.preventDefault();
      const on = cur.trimStart().startsWith("//");
      const next = on ? cur.replace(/^(\s*)\/\/\s?/, "$1") : "// " + cur;
      return apply(code.slice(0, s) + next + code.slice(en), Math.max(s, caret + next.length - cur.length));
    }
    if (e.shiftKey && e.key === "Enter" && !mod) { e.preventDefault(); return apply(code.slice(0, en) + "\n" + code.slice(en), en + 1); }
    if (mod && e.altKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      const f = code.split("\n").map((l) => l.trim().replace(/\s*=\s*/, " = ").replace(/\s*,\s*/g, ", ")).join("\n");
      return apply(f, Math.min(caret, f.length));
    }
    if (e.altKey && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const arr = code.split("\n");
      const j = caretLine + (e.key === "ArrowUp" ? -1 : 1);
      if (j < 0 || j >= arr.length) return;
      [arr[caretLine], arr[j]] = [arr[j]!, arr[caretLine]!];
      const pos = arr.slice(0, j).join("\n").length + (j ? 1 : 0) + caretCol;
      return apply(arr.join("\n"), pos);
    }
  };

  const wqi = result.wqi;
  return (
    <section className="analysis-panel" aria-labelledby="calculator-title">
      <div className="ide">
        <div className="ide-titlebar">
          <span className="ide-dots"><i /><i /><i /></span>
          <span className="ide-tab">sample.wqi</span>
          <div className="ide-actions">
            <Button variant="ghost" size="icon" aria-label="Reset sample" title="Reset sample" onClick={() => apply(INITIAL, 0)}><RotateCcw /></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Editor settings" title="Editor settings"><Link to="/settings"><Settings2 /></Link></Button>
          </div>
        </div>
        <div className="ide-body" style={{ fontSize: font, ["--line-h" as string]: `${LINE_H}px` }}>
          {settings.lineNumbers && (
            <div className="ide-gutter" aria-hidden style={{ transform: `translateY(${-scroll.top}px)` }}>
              {lines.map((_, i) => <div key={i} className={`${i === caretLine ? "current" : ""} ${errorLines.has(i + 1) ? "error" : ""}`}>{i + 1}</div>)}
            </div>
          )}
          <div className="ide-code">
            <pre className="ide-highlight" aria-hidden style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}>
              {lines.map((l, i) => (
                <div key={i} className={`ide-line ${settings.highlightLine && i === caretLine ? "active" : ""} ${errorLines.has(i + 1) ? "has-error" : ""}`}>
                  {highlight(l).map((p, k) => <span key={k} className={p.c}>{p.t}</span>)}{"\u200b"}
                </div>
              ))}
            </pre>
            <textarea
              id="calculator-title"
              ref={ta}
              aria-label="Sample editor"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCaret(e.target.selectionStart); setPopup({ open: true, index: 0 }); }}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(() => setPopup({ open: false, index: 0 }), 150)}
              onScroll={(e) => setScroll({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })}
            />
            {items.length > 0 && (
              <ul className="ide-suggest" role="listbox" aria-label="Suggestions" style={{ top: PAD + (caretLine + 1) * LINE_H - scroll.top, left: `calc(${PAD}px + ${Math.max(0, caretCol - prefix.length)}ch - ${scroll.left}px)` }}>
                {items.map((it, i) => (
                  <li key={it.label} role="option" aria-selected={i === popup.index} className={i === popup.index ? "selected" : ""} onMouseDown={(e) => { e.preventDefault(); accept(it.label); }}>
                    <span className={`kind kind-${it.kind}`}>{it.kind === "template" ? "T" : it.kind === "param" ? "P" : it.kind === "keyword" ? "K" : "V"}</span>
                    <strong>{it.label}</strong><small>{it.detail}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="ide-statusbar">
          <span>{result.errors.length ? <><CircleAlert className="size-3" />{result.errors.length} problem{result.errors.length > 1 ? "s" : ""}</> : "No problems"}</span>
          <span><Keyboard className="size-3" />{settings.keymap ? "IntelliJ keymap" : "Keymap off"} · Ln {caretLine + 1}, Col {caretCol + 1}</span>
        </div>
        <div className="ide-console" aria-live="polite">
          <div className="ide-console-title"><TerminalSquare className="size-3.5" />Console</div>
          {result.errors.map((er) => <div key={`e${er.line}`} className="console-error">line {er.line}: {er.message}</div>)}
          {result.output.map((o) => <div key={`o${o.line}`}>&gt; {o.text}</div>)}
          {!result.errors.length && !result.output.length && <div className="text-muted-foreground">Type <code>sout</code> then Tab to print the WQI.</div>}
        </div>
      </div>
      <div className="calculator-result">
        <div><div className="text-xs text-muted-foreground">Weighted arithmetic index</div><div className="mt-1 text-sm font-semibold">Sample WQI</div></div>
        {wqi !== undefined && !result.errors.length ? (
          <div className="flex flex-wrap items-center justify-end gap-3"><strong className={`quality-value text-3xl ${GRADE_CLASS[gradeWQI(wqi)]}`}>{wqi}</strong><GradeBadge grade={gradeWQI(wqi)} /></div>
        ) : (
          <span className="max-w-56 text-right text-xs text-destructive">{result.errors.length ? "Fix the problems above." : `Set all six parameters: ${KEYS.filter((k) => result.reading[k] === undefined).join(", ")}.`}</span>
        )}
      </div>
    </section>
  );
}
