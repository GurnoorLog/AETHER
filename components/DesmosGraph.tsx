"use client";

import { useEffect, useRef } from "react";

export default function DesmosGraph({ expressions = [] }: { expressions?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const calcR = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
    script.onload = () => {
      calcR.current = (window as any).Desmos.Calculator(el, { expressions: true, zoomButtons: true });
      for (let i = 0; i < expressions.length; i++) {
        calcR.current.setExpression({ id: `graph${i}`, latex: expressions[i] });
      }
    };
    document.head.appendChild(script);
    return () => {
      calcR.current?.destroy();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!calcR.current) return;
    const calc = calcR.current;
    calc.setBlank();
    for (let i = 0; i < expressions.length; i++) {
      calc.setExpression({ id: `graph${i}`, latex: expressions[i] });
    }
  }, [expressions]);

  return <div ref={ref} className="w-full h-[450px] rounded-2xl overflow-hidden border border-hairline-warm editorial" />;
}
