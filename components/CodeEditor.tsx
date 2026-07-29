"use client";

export default function CodeEditor({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="h-full flex flex-col bg-black/40 border-l border-white/5">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-[10px] font-bold text-white/30 hover:text-white/60 px-2 py-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
          >
            Copy
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="flex-1 w-full bg-transparent text-sm text-white/90 font-mono p-4 resize-none outline-none placeholder-white/20 leading-relaxed"
        spellCheck={false}
        placeholder="// Code will appear here when the AI shares examples"
      />
    </div>
  );
}
