import { useState, useCallback, useRef } from 'react';
import { sendTelemetry } from '../api';
import type { TelemetryFormState } from '../validation';
import type { Uuid } from '@/types';

interface UseTelemetryReturn {
  recordInteraction: () => void;
  recordProblemSwitch: () => void;
  sendFormTelemetry: (reportUuid?: Uuid) => Promise<void>;
  telemetryState: TelemetryFormState;
}

/**
 * Hook to track form interactions and send telemetry
 * Tracks start time, interactions count, and problem path switches
 * 
 * @param token - The report link token
 * @returns Telemetry recording functions and current state
 * 
 * @example
 * const { recordInteraction, recordProblemSwitch, sendFormTelemetry } = useTelemetry(token);
 * 
 * // On field interaction
 * <input onFocus={recordInteraction} />
 * 
 * // On submit
 * await sendFormTelemetry(reportUuid);
 */
export function useTelemetry(token: string): UseTelemetryReturn {
  const [telemetryState, setTelemetryState] = useState<TelemetryFormState>({
    startTime: Date.now(),
    endTime: null,
    interactions: 0,
    switchedToProblems: false,
  });

  // Use ref to track if we've already sent telemetry to avoid duplicates
  const hasSentRef = useRef(false);

  const recordInteraction = useCallback(() => {
    setTelemetryState(prev => ({ 
      ...prev, 
      interactions: prev.interactions + 1 
    }));
  }, []);

  const recordProblemSwitch = useCallback(() => {
    setTelemetryState(prev => ({ 
      ...prev, 
      switchedToProblems: true 
    }));
  }, []);

  const sendFormTelemetry = useCallback(async (reportUuid?: Uuid) => {
    // Prevent duplicate sends
    if (hasSentRef.current) return;
    hasSentRef.current = true;

    const endTime = Date.now();
    const duration = (endTime - telemetryState.startTime) / 1000; // seconds

    await sendTelemetry({
      eventType: 'FORM_SUBMIT',
      occurredAt: new Date().toISOString(),
      metadata: {
        duration,
        interactions: telemetryState.interactions,
        switchedToProblems: telemetryState.switchedToProblems,
      },
      linkUuid: token,
      reportUuid: reportUuid || null,
    });

    setTelemetryState(prev => ({
      ...prev,
      endTime,
    }));
  }, [telemetryState, token]);

  return {
    recordInteraction,
    recordProblemSwitch,
    sendFormTelemetry,
    telemetryState,
  };
}


