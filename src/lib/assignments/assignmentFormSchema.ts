import { z } from "zod";

/**
 * Schema walidacji formularza przypisania kierowca-pojazd
 *
 * Waliduje:
 * - driverUuid - wymagane UUID
 * - vehicleUuid - wymagane UUID
 * - startDate - wymagana data w formacie YYYY-MM-DD
 * - endDate - opcjonalna data w formacie YYYY-MM-DD, musi być >= startDate
 */
export const assignmentFormSchema = z
  .object({
    driverUuid: z.string({ required_error: "Kierowca jest wymagany" }).uuid("Wybierz kierowcę z listy"),

    vehicleUuid: z.string({ required_error: "Pojazd jest wymagany" }).uuid("Wybierz pojazd z listy"),

    startDate: z
      .string({ required_error: "Data rozpoczęcia jest wymagana" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty (wymagany YYYY-MM-DD)")
      .refine((date) => {
        // Sprawdź czy to poprawna data
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }, "Nieprawidłowa data"),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty (wymagany YYYY-MM-DD)")
      .refine((date) => {
        if (!date) return true; // Empty string is ok
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }, "Nieprawidłowa data")
      .optional()
      .or(z.literal("")), // Allow empty string
  })
  .refine(
    (data) => {
      // Walidacja: endDate >= startDate
      if (!data.endDate || data.endDate === "") return true;

      const startDateMs = new Date(data.startDate).getTime();
      const endDateMs = new Date(data.endDate).getTime();

      return endDateMs >= startDateMs;
    },
    {
      message: "Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia",
      path: ["endDate"], // Błąd przypisany do pola endDate
    }
  );

export type AssignmentFormSchema = z.infer<typeof assignmentFormSchema>;
