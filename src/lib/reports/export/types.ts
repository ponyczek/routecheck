import type { IsoDateOnlyString } from "@/types";

/**
 * Date range for report export
 * Used by react-day-picker Calendar component
 */
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

/**
 * Form data for CSV export modal
 */
export interface ExportCsvFormData {
  dateRange: DateRange;
  includeAi: boolean;
  includeTags: boolean;
}

/**
 * Validation errors for export form
 */
export interface ExportCsvValidationErrors {
  dateRange?: string;
}

/**
 * Props for the main ExportCsvModal component
 */
export interface ExportCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

/**
 * Query parameters for GET /api/reports/export
 */
export interface ExportCsvQueryParams {
  from: IsoDateOnlyString;
  to: IsoDateOnlyString;
  includeAi?: boolean;
  includeTags?: boolean;
}

/**
 * Props for DateRangeSelector component
 */
export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange | undefined) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Props for ExportOptionsCheckboxes component
 */
export interface ExportOptionsCheckboxesProps {
  includeAi: boolean;
  includeTags: boolean;
  onIncludeAiChange: (checked: boolean) => void;
  onIncludeTagsChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Props for ExportProgressSection component
 */
export interface ExportProgressSectionProps {
  isExporting: boolean;
}

/**
 * Props for ExportCsvModalFooter component
 */
export interface ExportCsvModalFooterProps {
  onCancel: () => void;
  onExport: () => void;
  isExporting: boolean;
  isDisabled: boolean;
}
