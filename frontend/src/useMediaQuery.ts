/* AgentFlow — responsive breakpoint hook (P0-2)
 *
 * SSR-safe (guards `window`) and subscribes via `matchMedia` so the
 * returned boolean updates live when the viewport crosses the query.
 */
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    // Sync once in case the query result changed between init and effect.
    handler();
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
