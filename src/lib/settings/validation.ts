import { z } from "zod";

export const editCompanyNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nazwa firmy musi mieć co najmniej 2 znaki")
    .max(100, "Nazwa firmy może mieć maksymalnie 100 znaków")
    .refine((val) => val.length > 0, "Nazwa firmy nie może być pusta"),
});

export type EditCompanyNameFormValues = z.infer<typeof editCompanyNameSchema>;
