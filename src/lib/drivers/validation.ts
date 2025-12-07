import { z } from 'zod';

/**
 * Schema walidacji formularza dodawania/edycji kierowcy
 */
export const driverFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Imię musi mieć minimum 2 znaki')
    .max(100, 'Imię może mieć maksymalnie 100 znaków')
    .trim(),
  email: z
    .string()
    .email('Nieprawidłowy format adresu e-mail')
    .max(255, 'Email może mieć maksymalnie 255 znaków')
    .trim()
    .toLowerCase(),
  timezone: z
    .string()
    .min(1, 'Strefa czasowa jest wymagana')
    .refine(
      (val) => {
        try {
          // Walidacja czy strefa czasowa jest prawidłowa (IANA timezone)
          Intl.DateTimeFormat(undefined, { timeZone: val });
          return true;
        } catch {
          return false;
        }
      },
      'Nieprawidłowa strefa czasowa'
    ),
  isActive: z.boolean().default(true),
});

/**
 * Typ wywnioskowany ze schematu walidacji
 */
export type DriverFormData = z.infer<typeof driverFormSchema>;



