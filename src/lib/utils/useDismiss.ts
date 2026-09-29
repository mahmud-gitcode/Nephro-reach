import { useEffect, useRef } from "react";

/* A menu that stays open after a tap elsewhere is one a member has to
   fight, and on a phone it covers the page underneath it.

   Returns a ref for the element holding the button and its menu: a tap
   outside it, or Escape, calls `close`. Pass a stable `close`
   (useCallback) so the listeners are not re-bound on every render. */
export function useDismiss<T extends HTMLElement>(
  open: boolean,
  close: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}
