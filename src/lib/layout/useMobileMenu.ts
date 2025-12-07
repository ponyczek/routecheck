import { useState, useCallback, useEffect } from "react";
import { useActiveRoute } from "./useActiveRoute";
import type { MobileMenuState } from "./types";

/**
 * Custom hook for managing mobile menu state
 *
 * This hook:
 * - Manages isOpen state for mobile Sheet menu
 * - Provides toggle, open, close functions
 * - Auto-closes menu on route change
 * - Handles focus trap (delegated to Shadcn Sheet component)
 *
 * @returns MobileMenuState with isOpen, toggle, close, open
 */
export function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useActiveRoute();

  // Auto-close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      // Add class to body to prevent scrolling
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    open,
  };
}
