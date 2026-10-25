
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function prepareNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-reminders', {
      name: 'Expiry reminders',
      description: 'Reminders for products approaching expiry',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#238653',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return status === 'granted';
}

export async function scheduleExpiryReminders(
  productName: string,
  expiryDate: string,
  reminderDays: number[],
) {
  const allowed = await prepareNotifications();

  if (!allowed) {
    return [];
  }

  const [year, month, day] = expiryDate.split('-').map(Number);
  const expiry = new Date(year, month - 1, day, 9, 0, 0);

  const ids: string[] = [];

  for (const daysBefore of reminderDays) {
    const reminder = new Date(expiry);
    reminder.setDate(reminder.getDate() - daysBefore);

    // Do not schedule notifications in the past.
    if (reminder.getTime() <= Date.now()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ShelfLife expiry reminder',
        body: `${productName} expires in ${daysBefore} day(s). Check your stock!`,
        sound: true,
        data: {
          productName,
          expiryDate,
          daysBefore,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder,
        channelId: 'expiry-reminders',
      },
    });

    ids.push(id);
  }

  return ids;
}

export async function cancelExpiryReminders(ids: string[] = []) {
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
