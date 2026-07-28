"use client";

import { useState, useEffect } from "react";

export function useAutoCollapse(delayMs = 2000) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return expanded;
}
