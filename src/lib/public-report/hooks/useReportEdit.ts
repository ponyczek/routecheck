import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { reportFormSchema, type ReportFormViewModel } from "@/lib/public-report/validation";
import { updateReport } from "@/lib/public-report/api";
import { getReportToken } from "@/lib/public-report/utils/storage";
import { isBefore } from "@/lib/public-report/utils/formatters";

import type { PublicReportUpdateCommand, Uuid, IsoDateString, ProblemDetail } from "@/types";

interface UseReportEditReturn {
  form: ReturnType<typeof useForm<ReportFormViewModel>>;
  isEditing: boolean;
  canEdit: boolean;
  editMutation: ReturnType<typeof useMutation>;
  handleEdit: (data: ReportFormViewModel) => void;
}

/**
 * Hook to handle report editing within the 10-minute window
 * Loads existing report data and manages PATCH submission
 *
 * @param reportUuid - UUID of the report to edit
 * @param editableUntil - ISO timestamp when edit window expires
 * @param initialData - Initial form data to pre-fill
 * @param onSuccess - Callback on successful edit
 * @param onError - Callback on edit error
 * @returns Form instance, edit state, and handlers
 *
 * @example
 * const { form, canEdit, handleEdit } = useReportEdit(
 *   reportUuid,
 *   editableUntil,
 *   existingData,
 *   () => console.log('Updated!'),
 *   (err) => console.error(err)
 * );
 */
export function useReportEdit(
  reportUuid: Uuid,
  editableUntil: IsoDateString,
  initialData: Partial<ReportFormViewModel>,
  onSuccess?: () => void,
  onError?: (error: ProblemDetail) => void
): UseReportEditReturn {
  const [canEdit, setCanEdit] = useState(() => isBefore(editableUntil));

  // Check edit window expiration
  useEffect(() => {
    if (!isBefore(editableUntil)) {
      setCanEdit(false);
      return;
    }

    // Set timeout to disable editing when window expires
    const timeLeft = new Date(editableUntil).getTime() - Date.now();
    const timer = setTimeout(() => {
      setCanEdit(false);
      toast.warning("Okno edycji minęło", {
        description: "Nie możesz już edytować tego raportu.",
      });
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [editableUntil]);

  // Form setup with initial data
  const form = useForm<ReportFormViewModel>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      isProblem: initialData.isProblem ?? false,
      routeStatus: initialData.routeStatus ?? "COMPLETED",
      delayMinutes: initialData.delayMinutes ?? 0,
      delayReason: initialData.delayReason ?? "",
      cargoDamageDescription: initialData.cargoDamageDescription ?? null,
      vehicleDamageDescription: initialData.vehicleDamageDescription ?? null,
      nextDayBlockers: initialData.nextDayBlockers ?? null,
      timezone:
        initialData.timezone ??
        (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Warsaw"),
    },
    mode: "onBlur",
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data: ReportFormViewModel) => {
      // Get token from SessionStorage
      const token = getReportToken(reportUuid);

      if (!token) {
        throw new Error("No token found for report edit");
      }

      // Transform to update command (only changed fields)
      const command: PublicReportUpdateCommand = {
        routeStatus: data.isProblem ? data.routeStatus : "COMPLETED",
        delayMinutes: data.isProblem ? data.delayMinutes : 0,
        delayReason: data.isProblem && data.delayReason ? data.delayReason : null,
        cargoDamageDescription: data.isProblem ? data.cargoDamageDescription : null,
        vehicleDamageDescription: data.isProblem ? data.vehicleDamageDescription : null,
        nextDayBlockers: data.isProblem ? data.nextDayBlockers : null,
        timezone: data.timezone,
      };

      await updateReport(reportUuid, token, command);
    },
    onSuccess: () => {
      toast.success("Raport zaktualizowany", {
        description: "Zmiany zostały zapisane.",
      });
      onSuccess?.();
    },
    onError: (error: ProblemDetail) => {
      if (error.code === "403") {
        toast.error("Brak uprawnień do edycji", {
          description: "Nie możesz edytować tego raportu.",
        });
        setCanEdit(false);
      } else if (error.code === "409") {
        toast.error("Okno edycji minęło", {
          description: "Przekroczono limit 10 minut od wysłania.",
        });
        setCanEdit(false);
      } else if (error.code === "VALIDATION_ERROR" && error.details) {
        Object.entries(error.details).forEach(([field, message]) => {
          form.setError(field as keyof ReportFormViewModel, {
            type: "server",
            message: message as string,
          });
        });
        toast.error("Sprawdź poprawność wypełnionych pól");
      } else {
        toast.error("Nie udało się zaktualizować raportu", {
          description: "Spróbuj ponownie za chwilę.",
        });
      }
      onError?.(error);
    },
  });

  const handleEdit = (data: ReportFormViewModel) => {
    if (!canEdit) {
      toast.warning("Nie możesz już edytować tego raportu");
      return;
    }

    editMutation.mutate(data);
  };

  return {
    form,
    isEditing: editMutation.isPending,
    canEdit,
    editMutation,
    handleEdit,
  };
}
