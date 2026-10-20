import { useCallback, useEffect, useState } from 'react';
import { checkForUpdates } from '../features/app/app.api';
import type { VersionInfo } from '../types/models';

type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'current'; info: VersionInfo }
  | { status: 'optional'; info: VersionInfo }
  | { status: 'required'; info: VersionInfo }
  | { status: 'unavailable'; reason: string };

export function useUpdateCheck(checkOnMount = true) {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    setState({ status: 'checking' });
    const result = await checkForUpdates();
    if (!result.ok) {
      setState({ status: 'unavailable', reason: result.reason });
      return;
    }
    if (result.info.updateRequired) setState({ status: 'required', info: result.info });
    else if (result.info.updateAvailable) setState({ status: 'optional', info: result.info });
    else setState({ status: 'current', info: result.info });
  }, []);

  useEffect(() => {
    if (checkOnMount) void check();
  }, [check, checkOnMount]);

  return { state, dismissed, dismiss: () => setDismissed(true), check };
}
