/**
 * Settings module exports
 * Provides hooks and utilities for managing company, alerts, and account settings
 */

// Query hooks
export {
  useCompany,
  useUpdateCompany,
  useAlertsConfig,
  useUpdateAlertsConfig,
  useTelemetryAggregates,
  useEmailLogs,
  companyKeys,
  alertsKeys,
  telemetryKeys,
  emailLogsKeys,
} from "./queries";

// Account settings hooks
export { useSessionData } from "./useSessionData";

// Types
export type {
  EditCompanyNameFormValues,
  SessionStatus,
  SessionViewModel,
  AccountSettingsViewProps,
  SessionInfoCardProps,
  SessionStatusIndicatorProps,
  SessionExpiryWarningProps,
  UserInfoCardProps,
  UserEmailDisplayProps,
  SecurityTipsCardProps,
  SecurityTipsListProps,
  AccountActionsCardProps,
  LogoutButtonProps,
} from "./types";

// Session transformers
export {
  transformSupabaseSession,
  formatSessionDate,
  getSessionStatusText,
  getSessionStatusVariant,
} from "./sessionTransformers";

// Validation
export { editCompanyNameSchema } from "./validation";
export type { EditCompanyNameFormValues as CompanyFormData } from "./validation";

// Form hooks
export { useCompanyNameForm } from "./useCompanyNameForm";
