import { CircleCheckBig, TriangleAlert } from "lucide-react";

interface StatusSwitchProps {
  value: boolean; // true = problem, false = ok
  onChange: (isProblem: boolean) => void;
}

/**
 * StatusSwitch - Large visual toggle between happy path and problem path
 * Two large buttons: "Wszystko OK" and "Mam problem"
 *
 * @example
 * <StatusSwitch value={isProblem} onChange={setIsProblem} />
 */
export function StatusSwitch({ value, onChange }: StatusSwitchProps) {
  const isHappyPath = !value;
  const isProblemPath = value;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Wybierz status trasy">
      {/* Happy Path Button */}
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`
          flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all
          focus:outline-none focus:ring-4 focus:ring-green-500/20
          ${
            isHappyPath
              ? "border-green-500 bg-green-50 shadow-lg scale-[1.02]"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }
        `}
        aria-pressed={isHappyPath}
        role="radio"
        aria-checked={isHappyPath}
      >
        <CircleCheckBig
          className={`w-12 h-12 ${isHappyPath ? "text-green-600" : "text-gray-400"}`}
          aria-hidden="true"
        />
        <div className="text-center">
          <div className={`text-lg font-semibold ${isHappyPath ? "text-green-900" : "text-gray-700"}`}>Wszystko OK</div>
          <div className={`text-sm mt-1 ${isHappyPath ? "text-green-700" : "text-gray-500"}`}>
            Trasa przebiegła bez problemów
          </div>
        </div>
      </button>

      {/* Problem Path Button */}
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`
          flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all
          focus:outline-none focus:ring-4 focus:ring-orange-500/20
          ${
            isProblemPath
              ? "border-orange-500 bg-orange-50 shadow-lg scale-[1.02]"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }
        `}
        aria-pressed={isProblemPath}
        role="radio"
        aria-checked={isProblemPath}
      >
        <TriangleAlert
          className={`w-12 h-12 ${isProblemPath ? "text-orange-600" : "text-gray-400"}`}
          aria-hidden="true"
        />
        <div className="text-center">
          <div className={`text-lg font-semibold ${isProblemPath ? "text-orange-900" : "text-gray-700"}`}>
            Mam problem
          </div>
          <div className={`text-sm mt-1 ${isProblemPath ? "text-orange-700" : "text-gray-500"}`}>
            Zgłoś problem z trasą
          </div>
        </div>
      </button>
    </div>
  );
}
