import { useEffect, useRef } from "react";

// Watches for malpractice while `active` is true and calls onViolation(type).
// Types match the backend contract: tab_switch, fullscreen_exit, copy_attempt, paste_attempt, context_menu
export default function useProctor(active, onViolation) {
  const cb = useRef(onViolation);
  cb.current = onViolation;

  useEffect(() => {
    if (!active) return;
    const fire = (type) => cb.current(type);
    const onVisibility = () => { if (document.hidden) fire("tab_switch"); };
    const onFullscreen = () => { if (!document.fullscreenElement) fire("fullscreen_exit"); };
    const block = (type) => (e) => { e.preventDefault(); fire(type); };
    const onCopy = block("copy_attempt");
    const onPaste = block("paste_attempt");
    const onMenu = block("context_menu");

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onMenu);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onMenu);
    };
  }, [active]);
}
