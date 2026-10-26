// REPLACES app/_layout.tsx (your _layout_1.tsx, the ROOT layout)
// Adds: onboarding gate, notification setup + Snooze handling, household sync, new screens.
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { startHousehold } from '../lib/household';
import { handleNotificationResponse, refreshReminders, setupNotifications } from '../lib/notifications';
import { useSettings } from '../lib/settings';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { settings, loaded } = useSettings();

  useEffect(() => {
    setupNotifications().then(refreshReminders);
    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loaded && settings.householdCode) startHousehold(settings.householdCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.householdCode]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={!settings.onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="receipt" options={{ title: 'Scan receipt', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
