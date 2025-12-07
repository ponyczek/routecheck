import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { useMediaQuery } from "@/lib/drivers/useMediaQuery";
import type { ExportCsvModalProps, ExportCsvFormData, ExportCsvValidationErrors } from "@/lib/reports/export/types";
import { validateDateRange } from "@/lib/reports/export/validation";
import { formatDateToIsoDateOnly } from "@/lib/reports/export/utils";
import { useExportCsv } from "@/lib/reports/export/useExportCsv";
import { DateRangeSelector } from "./DateRangeSelector";
import { ExportOptionsCheckboxes } from "./ExportOptionsCheckboxes";
import { ExportInfoBanner } from "./ExportInfoBanner";
import { ExportProgressSection } from "./ExportProgressSection";

/**
 * Main CSV export modal component
 * Allows users to export reports to CSV with date range selection and options
 * Validates date range (max 31 days, no future dates) and handles export process
 * Uses Dialog on desktop and Sheet on mobile for better UX
 */
export function ExportCsvModal({ open, onOpenChange, companyName }: ExportCsvModalProps) {
  // Detect mobile viewport
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Form state
  const [formData, setFormData] = useState<ExportCsvFormData>({
    dateRange: { from: undefined, to: undefined },
    includeAi: true,
    includeTags: true,
  });

  const [validationErrors, setValidationErrors] = useState<ExportCsvValidationErrors>({});

  // Export hook
  const { exportCsv, isExporting } = useExportCsv();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        dateRange: { from: undefined, to: undefined },
        includeAi: true,
        includeTags: true,
      });
      setValidationErrors({});
    }
  }, [open]);

  // Validate date range on change
  useEffect(() => {
    if (formData.dateRange.from && formData.dateRange.to) {
      const error = validateDateRange(formData.dateRange);
      setValidationErrors({ dateRange: error });
    } else if (formData.dateRange.from || formData.dateRange.to) {
      // One date is selected but not both
      setValidationErrors({
        dateRange: "Zakres dat jest wymagany",
      });
    } else {
      // No dates selected yet
      setValidationErrors({});
    }
  }, [formData.dateRange]);

  // Check if form is valid
  const isFormValid = formData.dateRange.from && formData.dateRange.to && !validationErrors.dateRange;

  const isSubmitDisabled = !isFormValid || isExporting;

  // Handle export action
  const handleExport = async () => {
    // Final validation before export
    const validationError = validateDateRange(formData.dateRange);
    if (validationError) {
      setValidationErrors({ dateRange: validationError });
      return;
    }

    if (!formData.dateRange.from || !formData.dateRange.to) {
      setValidationErrors({ dateRange: "Zakres dat jest wymagany" });
      return;
    }

    // Prepare query parameters
    const params = {
      from: formatDateToIsoDateOnly(formData.dateRange.from),
      to: formatDateToIsoDateOnly(formData.dateRange.to),
      includeAi: formData.includeAi,
      includeTags: formData.includeTags,
    };

    // Call export hook
    const success = await exportCsv(params, companyName);

    // Close modal on success
    if (success) {
      onOpenChange(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (!isExporting) {
      onOpenChange(false);
    }
  };

  // Prevent closing during export
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isExporting) {
      // Don't allow closing during export
      return;
    }
    onOpenChange(newOpen);
  };

  // Shared form content
  const formContent = (
    <div className="space-y-4 px-4 sm:px-0">
      <DateRangeSelector
        value={formData.dateRange}
        onChange={(range) =>
          setFormData((prev) => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))
        }
        error={validationErrors.dateRange}
        disabled={isExporting}
      />

      <ExportOptionsCheckboxes
        includeAi={formData.includeAi}
        includeTags={formData.includeTags}
        onIncludeAiChange={(checked) => setFormData((prev) => ({ ...prev, includeAi: checked }))}
        onIncludeTagsChange={(checked) => setFormData((prev) => ({ ...prev, includeTags: checked }))}
        disabled={isExporting}
      />

      <ExportInfoBanner />

      <ExportProgressSection isExporting={isExporting} />
    </div>
  );

  // Shared footer buttons
  const footerButtons = (
    <>
      <Button variant="outline" onClick={handleCancel} disabled={isExporting} className="flex-1 sm:flex-none">
        Anuluj
      </Button>
      <Button onClick={handleExport} disabled={isSubmitDisabled} className="flex-1 sm:flex-none">
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Eksportuję...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Pobierz CSV
          </>
        )}
      </Button>
    </>
  );

  // Mobile view - Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Eksportuj raporty do CSV</SheetTitle>
          </SheetHeader>

          {formContent}

          <SheetFooter className="flex-row gap-2">{footerButtons}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view - Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Eksportuj raporty do CSV</DialogTitle>
        </DialogHeader>

        {formContent}

        <DialogFooter>{footerButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
