import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, Loader2 } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import type { IsoDateString, Uuid } from '@/types';

interface SuccessViewProps {
  reportUuid: Uuid;
  editableUntil: IsoDateString;
  token: string;
  onEdit?: () => void;
  isProcessingQueue?: boolean;
}

/**
 * SuccessView - Confirmation screen after successful report submission
 * Shows success message, countdown timer, and edit button (available for 10 minutes)
 * 
 * @example
 * <SuccessView 
 *   reportUuid={data.reportUuid}
 *   editableUntil={data.editableUntil}
 *   token={token}
 *   onEdit={() => setViewState({ type: 'form' })}
 * />
 */
export function SuccessView({ reportUuid, editableUntil, token, onEdit, isProcessingQueue }: SuccessViewProps) {
  const [canEdit, setCanEdit] = useState(true);
  const isOfflinePending = reportUuid === 'offline-pending';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        {/* Success Icon */}
        <div className="rounded-full bg-green-100 p-8">
          <CheckCircle className="w-20 h-20 text-green-600" aria-hidden="true" />
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {isOfflinePending ? 'Raport zapisany offline' : 'Raport wysłany pomyślnie!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isOfflinePending 
              ? 'Raport zostanie wysłany automatycznie po przywróceniu połączenia.'
              : 'Dziękujemy za zgłoszenie. Twój raport został zapisany.'
            }
          </p>
        </div>

        {/* Countdown Timer - only if not offline pending */}
        {!isOfflinePending && (
          <div className="w-full max-w-md">
            <CountdownTimer
              targetTime={editableUntil}
              onExpire={() => setCanEdit(false)}
            />
          </div>
        )}

        {/* Edit Button - only if not offline pending */}
        {!isOfflinePending && canEdit && (
          <Button
            onClick={onEdit}
            size="lg"
            variant="outline"
            className="font-semibold"
          >
            <Edit className="mr-2 w-5 h-5" aria-hidden="true" />
            Edytuj raport
          </Button>
        )}

        {/* Processing Queue Indicator */}
        {isProcessingQueue && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="text-sm font-medium">Wysyłanie raportu...</span>
          </div>
        )}

        {/* AI Processing Banner - only if not offline pending */}
        {!isOfflinePending && (
          <div className="w-full max-w-md mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Przetwarzanie raportu
                </p>
                <p className="text-sm text-blue-800">
                  AI analizuje Twój raport. Wyniki będą dostępne dla spedytora w ciągu 30 sekund.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report ID (for support) - only if not offline pending */}
        {!isOfflinePending && (
          <div className="text-xs text-gray-500 mt-8">
            <p>ID raportu: <code className="font-mono">{reportUuid}</code></p>
          </div>
        )}
      </div>
    </div>
  );
}

