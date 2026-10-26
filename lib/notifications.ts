// REPLACES lib/notifications.ts
// Smart reminders: instead of one ping per product, we schedule ONE morning summary per day
// for the next 14 days ("3 items expire this week") with a Snooze button.
// The summaries are rebuilt every time products change and every time the app opens.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, daysBetween, parseISODate, todayISO } from './dates';
import { getProducts } from './products';
import { getSettings } from './settings';

const IDS_KEY = 'shelflife_summary_ids';
const CHANNEL = 'expiry-reminders';
const CATEGORY = 'shelflife-summary';

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Expiry reminders',
      description: 'Morning summary of products approaching expiry',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#238653',
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: 'snooze', buttonTitle: 'Snooze 1 hour', options: { opensAppToForeground: false } },
    { identifier: 'open', buttonTitle: 'Open', options: { opensAppToForeground: true } },
  ]);
}

export async function prepareNotifications(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  return status === 'granted';
}

async function cancelSummaries() {
  try {
    const raw = await AsyncStorage.getItem(IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    for (const id of ids) await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
  await AsyncStorage.setItem(IDS_KEY, JSON.stringify([]));
}

export async function refreshReminders() {
  try {
    const settings = await getSettings();
    await cancelSummaries();
    if (!settings.remindersEnabled) return;

    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') return;

    const products = await getProducts();
    const ids: string[] = [];
    const today = todayISO();

    for (let i = 0; i < 14; i++) {
      const dayISO = addDays(today, i);
      const when = parseISODate(dayISO);
      when.setHours(settings.summaryHour, 0, 0, 0);
      if (when.getTime() <= Date.now()) continue;

      const dueToday = products.filter(p => daysBetween(dayISO, p.expiryDate) <= 0);
      const dueWeek = products.filter(p => {
        const d = daysBetween(dayISO, p.expiryDate);
        return d >= 1 && d <= 7;
      });
      if (dueToday.length === 0 && dueWeek.length === 0) continue;

      const names = [...dueToday, ...dueWeek].slice(0, 3).map(p => p.name).join(', ');
      const title = dueToday.length
        ? `${dueToday.length} item${dueToday.length > 1 ? 's' : ''} to use today`
        : `${dueWeek.length} item${dueWeek.length > 1 ? 's' : ''} expire this week`;
      const body = dueToday.length && dueWeek.length
        ? `Plus ${dueWeek.length} more this week. ${names}`
        : names;

      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, categoryIdentifier: CATEGORY, data: { kind: 'summary' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL,
        },
      });
      ids.push(id);
    }
    await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('refreshReminders failed', e);
  }
}

/** Call from a notification-response listener: handles the "Snooze 1 hour" button. */
export async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  if (response.actionIdentifier !== 'snooze') return;
  const { title, body } = response.notification.request.content;
  await Notifications.scheduleNotificationAsync({
    content: { title: title ?? 'ShelfLife', body: body ?? '', sound: true, categoryIdentifier: CATEGORY },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60,
      channelId: CHANNEL,
    },
  });
}

/** Kept so old saved products (which stored notificationIds) can still be cleaned up. */
export async function cancelExpiryReminders(ids: string[] = []) {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}
