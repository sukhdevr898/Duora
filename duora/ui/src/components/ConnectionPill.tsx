import { useApp } from '../state/app';
import { useRouter } from '../nav/router';

const LABELS = {
  online: 'Connected',
  connecting: 'Connecting',
  offline: 'Offline',
} as const;

export function ConnectionPill({ compact = false }: { compact?: boolean }) {
  const { server } = useApp();
  const { navigate } = useRouter();

  return (
    <button
      type="button"
      className={`connect-pill ${server.status} ${compact ? 'connect-pill--compact' : ''}`}
      onClick={() => navigate({ name: 'server' })}
      aria-label={`Server ${LABELS[server.status]} — open server health`}
      title={`Server ${LABELS[server.status].toLowerCase()}`}
    >
      <span className="connect-pill__dot" />
      {compact ? null : LABELS[server.status]}
      {server.status === 'online' && !compact ? (
        <span style={{ opacity: 0.7, fontWeight: 700 }}>· {server.latency}ms</span>
      ) : null}
    </button>
  );
}
