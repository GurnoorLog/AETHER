"use client";

import { useEffect, useState } from "react";

let initialized = false;

export default function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!chart.trim()) return;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!initialized) {
          mermaid.initialize({ startOnLoad: false, theme: "dark" });
          initialized = true;
        }
        const { svg: out } = await mermaid.render("md-" + Date.now(), chart);
        setSvg(out);
      } catch {}
    })();
  }, [chart]);

  if (!svg) return null;

  return <div className="bg-white rounded-[28px] p-4 overflow-x-auto editorial" dangerouslySetInnerHTML={{ __html: svg }} />;
}
