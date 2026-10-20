import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../state/call.store';
import { callCoordinator } from './CallCoordinator';
import { isExpoGo } from './runtime';
import type { CallType } from '../../types/models';

/**
 * Starts an outgoing call when the screen opens without an existing session.
 * Incoming calls already populated the store, so this is a no-op for them.
 */
export function useOutgoingCall(type: CallType) {
  const phase = useCallStore((s) => s.phase);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isExpoGo()) return;
    if (useCallStore.getState().callId) return;

    callCoordinator
      .startOutgoing(type)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not start the call');
      });
  }, [type]);

  return { phase, error };
}
