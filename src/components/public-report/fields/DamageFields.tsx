import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ReportFormViewModel } from '@/lib/public-report/validation';

interface DamageFieldsProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors?: FieldErrors<ReportFormViewModel>;
  onFocus?: () => void;
}

/**
 * DamageFields - Two optional textarea fields for cargo and vehicle damage
 * Both fields are optional with max 1000 characters each
 * 
 * @example
 * <DamageFields 
 *   register={register} 
 *   errors={errors}
 *   onFocus={recordInteraction}
 * />
 */
export function DamageFields({ register, errors, onFocus }: DamageFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Cargo Damage */}
      <div className="space-y-2">
        <Label htmlFor="cargoDamageDescription" className="text-base font-medium">
          Uszkodzenia ładunku (opcjonalnie)
        </Label>
        <Textarea
          id="cargoDamageDescription"
          placeholder="Opisz ewentualne uszkodzenia ładunku..."
          rows={3}
          maxLength={1000}
          {...register('cargoDamageDescription')}
          onFocus={onFocus}
          aria-invalid={errors?.cargoDamageDescription ? 'true' : 'false'}
          aria-describedby={errors?.cargoDamageDescription ? 'cargoDamage-error' : undefined}
          className="resize-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-start">
          <div>
            {errors?.cargoDamageDescription && (
              <p 
                id="cargoDamage-error" 
                className="text-sm text-red-600" 
                role="alert"
              >
                {errors.cargoDamageDescription.message}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500">Max 1000 znaków</span>
        </div>
      </div>

      {/* Vehicle Damage */}
      <div className="space-y-2">
        <Label htmlFor="vehicleDamageDescription" className="text-base font-medium">
          Usterki pojazdu (opcjonalnie)
        </Label>
        <Textarea
          id="vehicleDamageDescription"
          placeholder="Opisz ewentualne usterki pojazdu..."
          rows={3}
          maxLength={1000}
          {...register('vehicleDamageDescription')}
          onFocus={onFocus}
          aria-invalid={errors?.vehicleDamageDescription ? 'true' : 'false'}
          aria-describedby={errors?.vehicleDamageDescription ? 'vehicleDamage-error' : undefined}
          className="resize-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-start">
          <div>
            {errors?.vehicleDamageDescription && (
              <p 
                id="vehicleDamage-error" 
                className="text-sm text-red-600" 
                role="alert"
              >
                {errors.vehicleDamageDescription.message}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500">Max 1000 znaków</span>
        </div>
      </div>
    </div>
  );
}


