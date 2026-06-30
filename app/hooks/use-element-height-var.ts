import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Measures an element's height and publishes it as a CSS custom property on
 * `document.documentElement`, so dependent `calc()` offsets (e.g. stacked
 * sticky headers) are always derived from a real layout measurement instead
 * of a value captured mid-render. Updates on resize via ResizeObserver.
 */
export function useElementHeightVar<T extends HTMLElement>(
  varName: `--${string}`,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(varName, `${el.offsetHeight}px`);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, [varName]);

  return ref;
}
