import { Label } from '@/components/ui/label';
import type { UseFormRegister, FieldError } from 'react-hook-form';
import type { ReportFormViewModel } from '@/lib/public-report/validation';
import type { ReportRouteStatus } from '@/types';

interface RouteStatusFieldProps {
  register: UseFormRegister<ReportFormViewModel>;
  error?: FieldError;
  value?: ReportRouteStatus;
}

/**
 * RouteStatusField - Radio group for selecting route status
 * Three options: COMPLETED, PARTIALLY_COMPLETED, CANCELLED
 * 
 * @example
 * <RouteStatusField 
 *   register={register} 
 *   error={errors.routeStatus}
 *   value={watchRouteStatus}
 * />
 */
export function RouteStatusField({ register, error }: RouteStatusFieldProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="routeStatus" className="text-base font-semibold">
        Status trasy *
      </Label>
      
      <div className="space-y-2" role="radiogroup" aria-label="Status trasy">
        <label
          htmlFor="route-completed"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer transition-colors hover:border-gray-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
        >
          <input
            type="radio"
            id="route-completed"
            value="COMPLETED"
            {...register('routeStatus')}
            className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <div className="flex-1">
            <div className="font-medium">Ukończono</div>
            <div className="text-sm text-gray-600">Trasa została w pełni zrealizowana</div>
          </div>
        </label>

        <label
          htmlFor="route-partial"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer transition-colors hover:border-gray-300 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50"
        >
          <input
            type="radio"
            id="route-partial"
            value="PARTIALLY_COMPLETED"
            {...register('routeStatus')}
            className="w-5 h-5 text-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          />
          <div className="flex-1">
            <div className="font-medium">Częściowo wykonano</div>
            <div className="text-sm text-gray-600">Trasa została zrealizowana tylko w części</div>
          </div>
        </label>

        <label
          htmlFor="route-cancelled"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer transition-colors hover:border-gray-300 has-[:checked]:border-red-500 has-[:checked]:bg-red-50"
        >
          <input
            type="radio"
            id="route-cancelled"
            value="CANCELLED"
            {...register('routeStatus')}
            className="w-5 h-5 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          />
          <div className="flex-1">
            <div className="font-medium">Odwołano</div>
            <div className="text-sm text-gray-600">Trasa została anulowana</div>
          </div>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}


