"use client";

import { useEffect, useRef } from "react";

export default function DesmosGraph({ expressions = [] }: { expressions?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const calcRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
    script.onload = () => {
      calcRef.current = (window as any).Desmos.Calculator(el, { expressions: true, zoomButtons: true });
      expressions.forEach((expr, i) => {
        calcRef.current.setExpression({ id: `graph${i}`, latex: expr });
      });
    };
    document.head.appendChild(script);
    return () => {
      calcRef.current?.destroy();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!calcRef.current) return;
    const calc = calcRef.current;
    calc.setBlank();
    expressions.forEach((expr, i) => {
      calc.setExpression({ id: `graph${i}`, latex: expr });
    });
  }, [expressions]);

  return <div ref={ref} className="w-full h-[450px] rounded-2xl overflow-hidden border border-hairline-warm" />;
}
