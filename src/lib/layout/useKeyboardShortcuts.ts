import { useEffect } from "react";

/**
 * Keyboard shortcut configuration
 */
interface KeyboardShortcut {
  /** Key combination (e.g., "k", "Escape", "/") */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrlKey?: boolean;
  /** Whether Shift is required */
  shiftKey?: boolean;
  /** Callback to execute */
  callback: () => void;
  /** Optional description for accessibility */
  description?: string;
}

/**
 * Custom hook for managing keyboard shortcuts
 *
 * Provides a centralized way to handle keyboard shortcuts in the application.
 * Automatically handles platform differences (Cmd on Mac, Ctrl on Windows/Linux).
 *
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: "k", ctrlKey: true, callback: () => openSearch(), description: "Open search" },
 *   { key: "Escape", callback: () => closeModal(), description: "Close modal" },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        const isCorrectKey = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
        const isCorrectCtrl = shortcut.ctrlKey ? (event.metaKey || event.ctrlKey) : !event.metaKey && !event.ctrlKey;
        const isCorrectShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

        if (isCorrectKey && isCorrectCtrl && isCorrectShift) {
          // Don't trigger shortcuts when typing, unless it's Escape
          if (isTyping && event.key !== "Escape") {
            continue;
          }

          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Common keyboard shortcuts used across the application
 */
export const COMMON_SHORTCUTS = {
  ESCAPE: "Escape",
  SEARCH: "k",
  FORWARD_SLASH: "/",
} as const;

