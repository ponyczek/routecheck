import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import type { ReportFormViewModel } from '@/lib/public-report/validation';

interface DelayFieldsProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors: FieldErrors<ReportFormViewModel>;
  watch: UseFormWatch<ReportFormViewModel>;
  onFocus?: () => void;
}

/**
 * DelayFields - Number input for delay minutes + conditional textarea for reason
 * Delay reason is required when delayMinutes > 0 (min 3 characters)
 * 
 * @example
 * <DelayFields 
 *   register={register} 
 *   errors={errors}
 *   watch={watch}
 *   onFocus={recordInteraction}
 * />
 */
export function DelayFields({ register, errors, watch, onFocus }: DelayFieldsProps) {
  const watchDelayMinutes = watch('delayMinutes');
  const showDelayReason = watchDelayMinutes > 0;

  return (
    <div className="space-y-4">
      {/* Delay Minutes */}
      <div className="space-y-2">
        <Label htmlFor="delayMinutes" className="text-base font-medium">
          Opóźnienie (minuty) *
        </Label>
        <Input
          type="number"
          id="delayMinutes"
          min={0}
          step={1}
          placeholder="0"
          {...register('delayMinutes', { valueAsNumber: true })}
          onFocus={onFocus}
          aria-invalid={errors.delayMinutes ? 'true' : 'false'}
          aria-describedby={errors.delayMinutes ? 'delayMinutes-error' : undefined}
          className="text-lg font-medium focus:ring-2 focus:ring-blue-500"
        />
        {errors.delayMinutes && (
          <p 
            id="delayMinutes-error" 
            className="text-sm text-red-600" 
            role="alert"
          >
            {errors.delayMinutes.message}
          </p>
        )}
      </div>

      {/* Conditional Delay Reason */}
      {showDelayReason && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label htmlFor="delayReason" className="text-base font-medium">
            Powód opóźnienia *
          </Label>
          <p className="text-sm text-gray-600">
            Opisz przyczynę opóźnienia (minimum 3 znaki)
          </p>
          <Textarea
            id="delayReason"
            placeholder="Np. korek na autostradzie, awaria pojazdu..."
            rows={4}
            maxLength={1000}
            {...register('delayReason')}
            onFocus={onFocus}
            aria-invalid={errors.delayReason ? 'true' : 'false'}
            aria-describedby={errors.delayReason ? 'delayReason-error' : undefined}
            aria-required="true"
            className="resize-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between items-start">
            <div>
              {errors.delayReason && (
                <p 
                  id="delayReason-error" 
                  className="text-sm text-red-600" 
                  role="alert"
                >
                  {errors.delayReason.message}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-500">Max 1000 znaków</span>
          </div>
        </div>
      )}
    </div>
  );
}


