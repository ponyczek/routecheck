import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import type { ReportFormViewModel } from "@/lib/public-report/validation";
import { RouteStatusField } from "./fields/RouteStatusField";
import { DelayFields } from "./fields/DelayFields";
import { DamageFields } from "./fields/DamageFields";
import { BlockersField } from "./fields/BlockersField";

interface ProblemPathSectionProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors: FieldErrors<ReportFormViewModel>;
  watch: UseFormWatch<ReportFormViewModel>;
  onFieldFocus?: () => void;
}

/**
 * ProblemPathSection - Dynamic section with all problem-related form fields
 * Composition of RouteStatusField, DelayFields, DamageFields, and BlockersField
 * Shown when user selects "Mam problem"
 *
 * @example
 * {isProblem && (
 *   <ProblemPathSection
 *     register={register}
 *     errors={errors}
 *     watch={watch}
 *     onFieldFocus={recordInteraction}
 *   />
 * )}
 */
export function ProblemPathSection({ register, errors, watch, onFieldFocus }: ProblemPathSectionProps) {
  return (
    <div className="space-y-8 py-6">
      {/* Route Status Selection */}
      <RouteStatusField register={register} error={errors.routeStatus} />

      {/* Delay Information */}
      <DelayFields register={register} errors={errors} watch={watch} onFocus={onFieldFocus} />

      {/* Damage Reports */}
      <DamageFields register={register} errors={errors} onFocus={onFieldFocus} />

      {/* Next Day Blockers */}
      <BlockersField register={register} error={errors.nextDayBlockers} onFocus={onFieldFocus} />

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Wskazówka:</strong> Jeśli trasa została częściowo wykonana, opisz przyczynę w powodzie opóźnienia lub
          w problemach na jutro.
        </p>
      </div>
    </div>
  );
}
