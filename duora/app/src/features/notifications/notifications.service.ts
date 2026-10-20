import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { config } from '../../constants/config';
import { NotificationChannels, NotificationIds, type NotificationKind } from '../../constants/notification';
import { logger } from '../../utils/logger';
import { registerPushToken } from '../settings/users.api';

// Foreground presentation: calls ring as full events; messages show banners.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const kind = (notification.request.content.data?.kind as NotificationKind | undefined) ?? 'message';
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: kind !== 'message',
      shouldSetBadge: false,
    };
  },
});

export async function configureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NotificationChannels.MESSAGES, {
    name: 'Messages',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 180, 120, 180],
  });
  await Notifications.setNotificationChannelAsync(NotificationChannels.INCOMING_CALLS, {
    name: 'Incoming calls',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 300, 400],
    bypassDnd: false,
  });
  await Notifications.setNotificationChannelAsync(NotificationChannels.MISSED_CALLS, {
    name: 'Missed calls',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getPushToken(): Promise<string | null> {
  try {
    const projectId = config.easProjectId || undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return tokenData.data;
  } catch (err) {
    logger.warn('notifications', 'could not obtain push token (FCM/EAS not configured)', err);
    return null;
  }
}

export async function registerDevicePushToken(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const pushToken = await getPushToken();
  if (!pushToken) return;
  try {
    await registerPushToken({ pushToken, platform: 'android' });
  } catch (err) {
    logger.warn('notifications', 'server push-token registration failed', err);
  }
}

type TapRouter = (data: Record<string, unknown>) => void;
let tapRouter: TapRouter | null = null;

export function registerTapRouter(router: TapRouter): void {
  tapRouter = router;
}

/** Subscribes to notification taps (cold start + warm). Call once at bootstrap. */
export function observeNotificationTaps(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    logger.info('notifications', 'notification tapped', data);
    tapRouter?.(data);
  });

  // Cold start: the tap that launched the process.
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    tapRouter?.(data);
  });

  return () => sub.remove();
}

export async function presentNotification(input: {
  kind: NotificationKind;
  title: string;
  body: string;
  data: Record<string, unknown>;
  stableId: string;
}): Promise<string | null> {
  try {
    const channelId =
      input.kind === 'incoming_call'
        ? NotificationChannels.INCOMING_CALLS
        : input.kind === 'missed_call'
          ? NotificationChannels.MISSED_CALLS
          : NotificationChannels.MESSAGES;
    return await Notifications.scheduleNotificationAsync({
      identifier: input.stableId,
      content: {
        title: input.title,
        body: input.body,
        data: { ...input.data, kind: input.kind },
        sound: input.kind === 'incoming_call' ? 'default' : undefined,
      },
      trigger: { channelId, type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date() },
    });
  } catch (err) {
    logger.warn('notifications', 'present failed', err);
    return null;
  }
}

export async function dismissNotification(callId: string): Promise<void> {
  await Notifications.dismissNotificationAsync(NotificationIds.incomingCall(callId)).catch(() => undefined);
  await Notifications.dismissNotificationAsync(NotificationIds.missedCall(callId)).catch(() => undefined);
}

export async function dismissAll(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync().catch(() => undefined);
}
