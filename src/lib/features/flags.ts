/**
 * Feature flags for the application
 * 
 * Feature flags allow enabling/disabling features without code changes.
 * Set via environment variables (PUBLIC_* prefix for client-side access).
 */

export const FEATURE_FLAGS = {
  /**
   * Show vehicles module in navigation and enable /vehicles route
   * Default: false (disabled)
   */
  SHOW_VEHICLES: import.meta.env.PUBLIC_SHOW_VEHICLES === 'true' || false,

  /**
   * Show assignments module in navigation and enable /assignments route
   * Default: false (disabled)
   */
  SHOW_ASSIGNMENTS: import.meta.env.PUBLIC_SHOW_ASSIGNMENTS === 'true' || false,
} as const;


