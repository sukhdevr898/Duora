import { useEffect, useState } from 'react';
import { useCallStore } from '../../state/call.store';
import { formatDuration } from '../../utils/formatters';

/** Ticks once per second while a call is connected. */
export function useCallDuration(): string {
  const connectedAt = useCallStore((s) => s.connectedAt);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!connectedAt) {
      setSeconds(0);
      return;
    }
    const tick = () => setSeconds(Math.floor((Date.now() - connectedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  return formatDuration(seconds);
}
