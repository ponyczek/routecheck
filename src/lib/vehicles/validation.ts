import { z } from "zod";

/**
 * Schema walidacji formularza dodawania/edycji pojazdu
 */
export const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .min(2, "Numer rejestracyjny musi mieć minimum 2 znaki")
    .max(20, "Numer rejestracyjny nie może przekraczać 20 znaków")
    .trim(),
  vin: z
    .string()
    .max(17, "VIN nie może przekraczać 17 znaków")
    .regex(/^[A-HJ-NPR-Z0-9]*$/, "VIN może zawierać tylko znaki alfanumeryczne (bez I, O, Q)")
    .nullable()
    .optional()
    .transform((val) => (val === "" || val === null ? null : val)),
  isActive: z.boolean().default(true),
});

/**
 * Typ wywnioskowany ze schematu walidacji
 */
export type VehicleFormData = z.infer<typeof vehicleFormSchema>;
