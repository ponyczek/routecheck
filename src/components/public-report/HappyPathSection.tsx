import { CircleCheckBig } from "lucide-react";

/**
 * HappyPathSection - Minimalist section shown when driver selects "Wszystko OK"
 * Shows confirmation message and info about one-click submission
 *
 * @example
 * {!isProblem && <HappyPathSection />}
 */
export function HappyPathSection() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      <div className="rounded-full bg-green-100 p-6">
        <CircleCheckBig className="w-16 h-16 text-green-600" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Świetnie!</h3>
        <p className="text-lg text-gray-700 max-w-md">
          Trasa przebiegła bez problemów? Wyślij raport jednym kliknięciem.
        </p>
        <p className="text-sm text-gray-600 mt-4">Przez 10 minut będziesz mógł edytować ten raport.</p>
      </div>
    </div>
  );
}
