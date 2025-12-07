import { formatDateTime } from '@/lib/public-report/utils/formatters';
import type { IsoDateString } from '@/types';

interface FormFooterProps {
  editableUntil: IsoDateString;
}

/**
 * FormFooter - Footer with edit window info and privacy notice
 * Shows when the report can be edited and data protection info
 * 
 * @example
 * <FormFooter editableUntil="2025-01-01T21:10:00Z" />
 */
export function FormFooter({ editableUntil }: FormFooterProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-1">
          Możliwość edycji
        </p>
        <p className="text-blue-800">
          Będziesz mógł edytować ten raport przez <strong>10 minut</strong> od wysłania.
        </p>
        <p className="text-blue-800 mt-2">
          Edycja dostępna do:{' '}
          <time dateTime={editableUntil} className="font-medium">
            {formatDateTime(editableUntil)}
          </time>
        </p>
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>
          🔒 Przesłane dane są chronione i dostępne tylko dla Twojej firmy.
        </p>
      </div>
    </div>
  );
}


