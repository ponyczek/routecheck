import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { reportFormSchema, type ReportFormViewModel, type FormViewState } from "@/lib/public-report/validation";
import { submitReport } from "@/lib/public-report/api";
import { useNetworkStatus } from "@/lib/public-report/hooks/useNetworkStatus";
import { useTelemetry } from "@/lib/public-report/hooks/useTelemetry";
import { useOfflineQueue } from "@/lib/public-report/hooks/useOfflineQueue";
import { storeReportToken } from "@/lib/public-report/utils/storage";

import { TokenGuard } from "./TokenGuard";
import { FormHeader } from "./FormHeader";
import { FormFooter } from "./FormFooter";
import { OfflineBanner } from "./OfflineBanner";
import { StatusSwitch } from "./StatusSwitch";
import { HappyPathSection } from "./HappyPathSection";
import { ProblemPathSection } from "./ProblemPathSection";
import { SubmitButton } from "./SubmitButton";
import { SuccessView } from "./SuccessView";

import type {
  PublicReportLinkValidationDTO,
  PublicReportSubmitCommand,
  PublicReportSubmitResponseDTO,
  ProblemDetail,
} from "@/types";

interface PublicReportFormProps {
  token: string;
  onSuccess?: (data: PublicReportSubmitResponseDTO) => void;
  onError?: (error: ProblemDetail) => void;
}

/**
 * PublicReportForm - Main component for public report submission
 * Handles token validation, form state, happy/problem path, and submission
 * Integrates with React Hook Form, Zod validation, and TanStack Query
 *
 * @example
 * <PublicReportForm
 *   token={token}
 *   onSuccess={(data) => navigate('/success')}
 *   onError={(error) => console.error(error)}
 * />
 */
export function PublicReportForm({ token, onSuccess, onError }: PublicReportFormProps) {
  const [viewState, setViewState] = useState<FormViewState>({ type: "loading" });
  const [validationData, setValidationData] = useState<PublicReportLinkValidationDTO | null>(null);

  const isOnline = useNetworkStatus();
  const { recordInteraction, recordProblemSwitch, sendFormTelemetry } = useTelemetry(token);
  const offlineQueue = useOfflineQueue(isOnline, submitReport);

  // React Hook Form setup with Zod validation
  const form = useForm<ReportFormViewModel>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      isProblem: false,
      routeStatus: "COMPLETED",
      delayMinutes: 0,
      delayReason: "",
      cargoDamageDescription: null,
      vehicleDamageDescription: null,
      nextDayBlockers: null,
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Warsaw",
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;
  const watchIsProblem = watch("isProblem");

  // Handle problem switch
  const handleProblemSwitch = (isProblem: boolean) => {
    setValue("isProblem", isProblem);

    if (isProblem) {
      recordProblemSwitch();
    } else {
      // Reset problem fields when switching to happy path
      setValue("routeStatus", "COMPLETED");
      setValue("delayMinutes", 0);
      setValue("delayReason", "");
      setValue("cargoDamageDescription", null);
      setValue("vehicleDamageDescription", null);
      setValue("nextDayBlockers", null);
    }
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ReportFormViewModel) => {
      // Transform form data to API command
      const command: PublicReportSubmitCommand = {
        routeStatus: data.isProblem ? data.routeStatus : "COMPLETED",
        delayMinutes: data.isProblem ? data.delayMinutes : 0,
        delayReason: data.isProblem && data.delayReason ? data.delayReason : null,
        cargoDamageDescription: data.isProblem ? data.cargoDamageDescription : null,
        vehicleDamageDescription: data.isProblem ? data.vehicleDamageDescription : null,
        nextDayBlockers: data.isProblem ? data.nextDayBlockers : null,
        timezone: data.timezone,
      };

      // If offline, add to queue instead of submitting
      if (!isOnline) {
        await offlineQueue.addToQueue(token, command);
        // Return a placeholder response for offline submission
        return {
          reportUuid: "offline-pending",
          editableUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        };
      }

      return submitReport(token, command);
    },
    onSuccess: async (data) => {
      // Handle offline submission differently
      if (!isOnline && data.reportUuid === "offline-pending") {
        toast.info("Raport zapisany offline", {
          description: "Zostanie wysłany automatycznie po przywróceniu połączenia.",
        });
        return;
      }

      // Store token for edit functionality
      storeReportToken(data.reportUuid, token);

      // Send telemetry
      await sendFormTelemetry(data.reportUuid);

      // Update view state
      setViewState({ type: "success", data });

      // Show success toast
      toast.success("Raport wysłany pomyślnie", {
        description: "Możesz go edytować przez 10 minut.",
      });

      // Call onSuccess callback
      onSuccess?.(data);
    },
    onError: (error: ProblemDetail) => {
      // Handle validation errors
      if (error.code === "VALIDATION_ERROR" && error.details) {
        Object.entries(error.details).forEach(([field, message]) => {
          form.setError(field as keyof ReportFormViewModel, {
            type: "server",
            message: message as string,
          });
        });
        toast.error("Sprawdź poprawność wypełnionych pól");
      }
      // Handle token errors
      else if (["404", "409", "410"].includes(error.code)) {
        const errorType = error.code as "404" | "409" | "410";
        setViewState({
          type: "error",
          errorType,
          message: error.message,
        });
      }
      // Handle server errors
      else {
        toast.error("Nie udało się wysłać raportu", {
          description: "Spróbuj ponownie za chwilę.",
        });
      }

      // Call onError callback
      onError?.(error);
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    submitMutation.mutate(data);
  });

  // Handle token validation success
  const handleTokenValidated = (data: PublicReportLinkValidationDTO) => {
    if ("valid" in data && data.valid) {
      setValidationData(data);
      setViewState({ type: "form", data });
    }
  };

  // Render based on view state
  const renderContent = () => {
    switch (viewState.type) {
      case "loading":
        return null; // TokenGuard handles loading state

      case "error":
        return null; // TokenGuard handles error state

      case "success":
        return (
          <SuccessView
            reportUuid={viewState.data.reportUuid}
            editableUntil={viewState.data.editableUntil}
            token={token}
            isProcessingQueue={offlineQueue.isProcessing}
            onEdit={() => {
              // Reset to form view for editing
              if (validationData && "valid" in validationData && validationData.valid) {
                setViewState({ type: "form", data: validationData });
                toast.info("Możesz teraz edytować raport");
              }
            }}
          />
        );

      case "form":
      default:
        if (!validationData || !("valid" in validationData) || !validationData.valid) {
          return null;
        }

        return (
          <div className="max-w-2xl mx-auto p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <FormHeader
                driverName={validationData.driverName}
                vehicleRegistration={validationData.vehicleRegistration}
                expiresAt={validationData.expiresAt}
              />

              <OfflineBanner isOnline={isOnline} />

              <StatusSwitch value={watchIsProblem} onChange={handleProblemSwitch} />

              {!watchIsProblem ? (
                <HappyPathSection />
              ) : (
                <ProblemPathSection
                  register={register}
                  errors={errors}
                  watch={watch}
                  onFieldFocus={recordInteraction}
                />
              )}

              <SubmitButton isSubmitting={submitMutation.isPending} isProblem={watchIsProblem} isOnline={isOnline} />

              <FormFooter editableUntil={validationData.editableUntil} />
            </form>
          </div>
        );
    }
  };

  return (
    <TokenGuard token={token} onValidated={handleTokenValidated}>
      {renderContent()}
    </TokenGuard>
  );
}
