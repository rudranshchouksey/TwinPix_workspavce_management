import { useEffect } from "react";

type KeyMap = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboardShortcuts(keyMap: KeyMap, dependencies: any[] = []) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if the user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // Allow escape to blur out of inputs
        if (e.key === "Escape" && keyMap["Escape"]) {
          (document.activeElement as HTMLElement).blur();
          keyMap["Escape"](e);
        }
        return;
      }

      // Check for exact matches first (e.g. 'Shift+C')
      let keyCombo = e.key;
      if (e.ctrlKey || e.metaKey) keyCombo = `Cmd+${keyCombo}`;
      if (e.shiftKey) keyCombo = `Shift+${keyCombo}`;
      if (e.altKey) keyCombo = `Alt+${keyCombo}`;

      if (keyMap[keyCombo]) {
        e.preventDefault();
        keyMap[keyCombo](e);
      } else if (keyMap[e.key]) {
        // Fallback to simple key (e.g. 'c')
        e.preventDefault();
        keyMap[e.key](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, dependencies);
}
