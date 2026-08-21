"use client";

import { useState } from "react";
import { runCode } from "@/lib/code-runner";

interface CodeCellProps {
  language?: string;
  defaultCode?: string;
  readOnly?: boolean;
  onRun?: (code: string, output: string, error?: string) => void;
}

export default function CodeCell({ language = "python", defaultCode = "", readOnly = false, onRun }: CodeCellProps) {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    setError(null);
    const result = await runCode(language, code);
    setOutput(result.output);
    if (result.error) setError(result.error);
    setRunning(false);
    onRun?.(code, result.output, result.error);
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-black/40">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{language}</span>
        <div className="flex items-center gap-2">
          {readOnly ? null : (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-yellow/10 text-cyber-yellow text-[10px] font-bold hover:bg-cyber-yellow/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {running ? (
                <div className="w-3 h-3 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
              {running ? "Running..." : "Run"}
            </button>
          )}
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        readOnly={readOnly}
        className="w-full bg-transparent text-sm font-mono text-white/90 p-4 resize-none outline-none min-h-[80px]"
        spellCheck={false}
      />
      {(output || error) && (
        <div className={`border-t ${error ? "border-red-400/20 bg-red-400/[0.03]" : "border-white/[0.04] bg-white/[0.02]"}`}>
          {output && (
            <pre className="p-4 text-xs font-mono text-white/70 whitespace-pre-wrap">{output}</pre>
          )}
          {error && (
            <pre className="px-4 pb-4 text-xs font-mono text-red-400 whitespace-pre-wrap">{error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
