import { useEffect, useRef, type RefObject } from "react";
import { useState } from "react";

export function useScrollProgress(contentRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(() => {
    if (typeof window === "undefined") return 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    return scrollable <= 0 ? 1 : 0;
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }
      setProgress(Math.min(window.scrollY / scrollable, 1));
    };

    window.addEventListener("scroll", update, { passive: true });

    const ro = new ResizeObserver(update);
    if (contentRef.current) ro.observe(contentRef.current);

    return () => {
      window.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [contentRef]);

  return { sentinelRef, progress };
}
