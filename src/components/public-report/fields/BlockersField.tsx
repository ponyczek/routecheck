import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormRegister, FieldError } from 'react-hook-form';
import type { ReportFormViewModel } from '@/lib/public-report/validation';

interface BlockersFieldProps {
  register: UseFormRegister<ReportFormViewModel>;
  error?: FieldError;
  onFocus?: () => void;
}

/**
 * BlockersField - Textarea for next day blockers
 * Optional field, max 1000 characters
 * Required when routeStatus is PARTIALLY_COMPLETED and no delayReason
 * 
 * @example
 * <BlockersField 
 *   register={register} 
 *   error={errors.nextDayBlockers}
 *   onFocus={recordInteraction}
 * />
 */
export function BlockersField({ register, error, onFocus }: BlockersFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="nextDayBlockers" className="text-base font-medium">
        Problemy na jutro (opcjonalnie)
      </Label>
      <p className="text-sm text-gray-600">
        Czy coś może zablokować jutrzejszą trasę?
      </p>
      <Textarea
        id="nextDayBlockers"
        placeholder="Np. pojazd wymaga naprawy, brak rezerwacji..."
        rows={4}
        maxLength={1000}
        {...register('nextDayBlockers')}
        onFocus={onFocus}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'nextDayBlockers-error' : undefined}
        className="resize-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex justify-between items-start">
        <div>
          {error && (
            <p 
              id="nextDayBlockers-error" 
              className="text-sm text-red-600" 
              role="alert"
            >
              {error.message}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500">Max 1000 znaków</span>
      </div>
    </div>
  );
}


