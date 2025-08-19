import { useEffect, useMemo, useRef, useState } from "react";

interface UseImagePreloadReturn {
  loaded: boolean;
  total: number;
  completed: number;
}

export function useImagePreload(urls: string[]): UseImagePreloadReturn {
  const uniqueUrls = useMemo(() => Array.from(new Set((urls || []).filter((u) => typeof u === "string" && u.length > 0))), [urls]);
  const [completed, setCompleted] = useState(0);
  const totalRef = useRef<number>(uniqueUrls.length);
  const settledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    totalRef.current = uniqueUrls.length;
    setCompleted(0);
    settledRef.current.clear();

    if (uniqueUrls.length === 0) return;

    let isCancelled = false;

    const handleSettle = (src: string) => {
      if (isCancelled) return;
      if (!settledRef.current.has(src)) {
        settledRef.current.add(src);
        setCompleted((c) => c + 1);
      }
    };

    const imageObjects = uniqueUrls.map((src) => {
      const img = new Image();
      img.onload = () => handleSettle(src);
      img.onerror = () => handleSettle(src);
      img.src = src;
      return img;
    });

    return () => {
      isCancelled = true;
      imageObjects.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [uniqueUrls]);

  const total = totalRef.current;
  const loaded = total === 0 || completed >= total;

  return { loaded, total, completed };
}


