import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration, getTimeLeft } from '@/lib/public-report/utils/formatters';
import type { IsoDateString } from '@/types';

interface CountdownTimerProps {
  targetTime: IsoDateString;
  onExpire: () => void;
}

/**
 * CountdownTimer - Displays countdown to edit window expiration
 * Updates every second and calls onExpire when time runs out
 * 
 * @example
 * <CountdownTimer 
 *   targetTime={editableUntil}
 *   onExpire={() => setCanEdit(false)}
 * />
 */
export function CountdownTimer({ targetTime, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetTime));

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const remaining = getTimeLeft(targetTime);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpire]);

  if (timeLeft === 0) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-lg">
        <Clock className="w-5 h-5" aria-hidden="true" />
        <span className="font-medium">Okno edycji minęło</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center gap-2 text-blue-700 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      aria-live="polite"
      aria-atomic="true"
    >
      <Clock className="w-5 h-5" aria-hidden="true" />
      <span className="font-medium">
        Możesz edytować raport przez: <time className="font-bold">{formatDuration(timeLeft)}</time>
      </span>
    </div>
  );
}


