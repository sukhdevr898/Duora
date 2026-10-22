/**
 * Small feedback pieces used across the app:
 *
 * • `ErrorCard`  — a friendly, human readable failure with a recovery button
 * • `StatusPill` — the "connected / waking up / offline" dot used in headers
 * • `InlineNote` — a soft hint line for small tips
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from 'lucide-react-native';

import { useDuoraTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { PressableScale } from './ui';
import type { ErrorInfo } from '../api/client';

const ICONS = {
  offline: WifiOff,
  waking: Loader2,
  auth: ShieldAlert,
  conflict: AlertCircle,
  validation: AlertCircle,
  server: CloudOff,
  unknown: AlertCircle,
} as const;

/**
 * The error surface the user actually sees: a soft card with a headline, a
 * sentence they can act on and a button that retries the exact thing that
 * failed.
 */
export const ErrorCard = memo(function ErrorCard({
  error,
  onRetry,
  retryLabel,
  onSecondary,
  secondaryLabel,
}: {
  error: ErrorInfo;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}) {
  const { t } = useDuoraTheme();
  const Icon = ICONS[error.kind] ?? AlertCircle;
  const tone = error.kind === 'validation' ? t.peach : t.danger;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: `${tone}14`, borderColor: `${tone}3d` },
      ]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tone}22` }]}>
        <Icon size={17} strokeWidth={2.4} color={tone} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.text }]}>{error.title}</Text>
        <Text style={[styles.message, { color: t.text2 }]}>{error.message}</Text>
        {onRetry || onSecondary ? (
          <View style={styles.actions}>
            {onRetry ? (
              <PressableScale
                onPress={onRetry}
                accessibilityLabel={retryLabel ?? error.action}
                style={[styles.action, { borderColor: `${tone}55` }]}
              >
                <RefreshCw size={13} strokeWidth={2.6} color={tone} />
                <Text style={[styles.actionText, { color: tone }]}>{retryLabel ?? error.action}</Text>
              </PressableScale>
            ) : null}
            {onSecondary ? (
              <PressableScale
                onPress={onSecondary}
                accessibilityLabel={secondaryLabel}
                style={[styles.action, { borderColor: t.lineStrong }]}
              >
                <Text style={[styles.actionText, { color: t.text2 }]}>{secondaryLabel}</Text>
              </PressableScale>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
});

/** The happy path — a soft card that says "that worked". */
export const SuccessCard = memo(function SuccessCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const { t } = useDuoraTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: `${t.mint}14`, borderColor: `${t.mint}3d` }]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { backgroundColor: `${t.mint}22` }]}>
        <CheckCircle2 size={17} strokeWidth={2.4} color={t.mint} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        <Text style={[styles.message, { color: t.text2 }]}>{text}</Text>
      </View>
    </View>
  );
});

/** A dot + label — the connection state of the Duora server. */
export const StatusPill = memo(function StatusPill({
  status,
  label,
  onPress,
}: {
  status: 'online' | 'connecting' | 'offline';
  label: string;
  onPress?: () => void;
}) {
  const { t } = useDuoraTheme();
  const color = status === 'online' ? t.mint : status === 'connecting' ? t.peach : t.danger;

  const content = (
    <View style={[styles.pill, { backgroundColor: t.chipBg, borderColor: t.line }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color: t.text2 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label}>
      {content}
    </PressableScale>
  );
});

/** A soft hint line for a short, non-interactive note. */
export const InlineNote = memo(function InlineNote({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t } = useDuoraTheme();
  return (
    <View style={[styles.note, { backgroundColor: t.primaryGhost, borderColor: t.line }]}>
      <Info size={14} strokeWidth={2.4} color={t.primary} />
      <Text style={[styles.noteText, { color: t.text2 }]}>{text}</Text>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} accessibilityLabel={actionLabel}>
          <Text style={[styles.noteAction, { color: t.primary }]}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 11,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  message: { fontSize: 12.5, lineHeight: 18, marginTop: 3, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 11, flexWrap: 'wrap' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 11.5, fontWeight: '700', maxWidth: 230 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 11.5, fontWeight: '600', lineHeight: 16 },
  noteAction: { fontSize: 11.5, fontWeight: '800' },
});
