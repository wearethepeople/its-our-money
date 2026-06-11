/**
 * Client-side tracking of the first-look funnel step. While set, a refresh of
 * /first-look resumes at the stored step instead of restarting.
 *
 * Only call these from the client (event handlers / effects); localStorage
 * does not exist during SSR.
 */
const KEY = "first-look:step";

export function getFirstLookStep(): number | null {
  const stored = window.localStorage.getItem(KEY);
  if (stored === null) return null;
  const step = Number(stored);
  return Number.isInteger(step) && step >= 0 ? step : null;
}

export function setFirstLookStep(stepIndex: number) {
  window.localStorage.setItem(KEY, String(stepIndex));
}

export function clearFirstLookStep() {
  window.localStorage.removeItem(KEY);
}
