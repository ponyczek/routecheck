import { formatDateTime } from "@/lib/public-report/utils/formatters";
import type { IsoDateString } from "@/types";

interface FormHeaderProps {
  driverName: string;
  vehicleRegistration: string | null;
  expiresAt: IsoDateString;
}

/**
 * FormHeader - Header with driver greeting and vehicle information
 * Shows personalized greeting and link expiration time
 *
 * @example
 * <FormHeader
 *   driverName="Jan Kowalski"
 *   vehicleRegistration="WA12345"
 *   expiresAt="2025-01-01T22:00:00Z"
 * />
 */
export function FormHeader({ driverName, vehicleRegistration, expiresAt }: FormHeaderProps) {
  return (
    <div className="space-y-3 mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Cześć, {driverName}!</h1>

      <div className="space-y-1 text-gray-600">
        {vehicleRegistration ? (
          <p className="flex items-center gap-2">
            <span className="font-medium">Pojazd:</span>
            <span className="font-mono text-lg">{vehicleRegistration}</span>
          </p>
        ) : (
          <p className="text-gray-500 italic">Brak przypisanego pojazdu</p>
        )}

        <p className="text-sm">
          <span className="font-medium">Link wygasa:</span>{" "}
          <time dateTime={expiresAt}>{formatDateTime(expiresAt)}</time>
        </p>
      </div>
    </div>
  );
}
