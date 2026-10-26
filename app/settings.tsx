// NEW app/settings.tsx  -> currency, reminders, household sharing, business mode
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { generateHouseholdCode, householdAvailable, startHousehold, stopHousehold } from '../lib/household';
import { prepareNotifications, refreshReminders } from '../lib/notifications';
import { saveSettings, useSettings } from '../lib/settings';
import { Theme, useTheme } from '../lib/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { settings } = useSettings();
  const [currency, setCurrency] = useState(settings.currency);
  const [avg, setAvg] = useState(String(settings.avgItemValue));
  const [code, setCode] = useState('');

  useEffect(() => {
    setCurrency(settings.currency);
    setAvg(String(settings.avgItemValue));
  }, [settings.currency, settings.avgItemValue]);

  async function toggleReminders(v: boolean) {
    if (v && !(await prepareNotifications())) {
      return Alert.alert('Notifications are off', 'Allow notifications for ShelfLife in your phone settings.');
    }
    await saveSettings({ remindersEnabled: v });
    await refreshReminders();
  }

  async function changeHour(delta: number) {
    const next = (settings.summaryHour + delta + 24) % 24;
    await saveSettings({ summaryHour: next });
    await refreshReminders();
  }

  async function join(newCode: string) {
    if (!householdAvailable()) {
      return Alert.alert('Sharing not set up yet', 'Add your Firebase keys to the .env file (see README.md, section "Household sharing").');
    }
    const clean = newCode.trim().toUpperCase();
    if (clean.length < 4) return Alert.alert('Enter the household code', 'Ask the person who created it.');
    await saveSettings({ householdCode: clean });
    await startHousehold(clean);
    setCode('');
  }

  async function leave() {
    stopHousehold();
    await saveSettings({ householdCode: '' });
  }

  const hourLabel = `${String(settings.summaryHour).padStart(2, '0')}:00`;

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.section}>Money</Text>
      <View style={s.card}>
        <Text style={s.label}>Currency symbol</Text>
        <TextInput style={s.input} value={currency} onChangeText={setCurrency} onEndEditing={() => saveSettings({ currency: currency.trim() || 'MK' })} maxLength={4} />
        <Text style={s.label}>Average value of one item</Text>
        <TextInput
          style={s.input} value={avg} keyboardType="number-pad" onChangeText={setAvg}
          onEndEditing={() => saveSettings({ avgItemValue: Number(avg) > 0 ? Number(avg) : 3000 })}
        />
        <Text style={s.hint}>Used for “money saved” when you don't enter a price for a product.</Text>
      </View>

      <Text style={s.section}>Reminders</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Morning summary</Text>
            <Text style={s.hint}>One notification a day, with a Snooze button.</Text>
          </View>
          <Switch value={settings.remindersEnabled} onValueChange={toggleReminders} trackColor={{ true: t.green, false: t.track }} />
        </View>
        {settings.remindersEnabled ? (
          <View style={[s.row, { marginTop: 14 }]}>
            <Text style={[s.rowTitle, { flex: 1 }]}>Time</Text>
            <TouchableOpacity style={s.step} onPress={() => changeHour(-1)}><Text style={s.stepText}>−</Text></TouchableOpacity>
            <Text style={s.hour}>{hourLabel}</Text>
            <TouchableOpacity style={s.step} onPress={() => changeHour(1)}><Text style={s.stepText}>＋</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Text style={s.section}>Household sharing</Text>
      <View style={s.card}>
        {settings.householdCode ? (
          <>
            <Text style={s.rowTitle}>Sharing code: {settings.householdCode}</Text>
            <Text style={s.hint}>Give this code to family or housemates. Everyone sees the same shelf, list and alerts.</Text>
            <TouchableOpacity style={s.danger} onPress={leave}><Text style={s.dangerText}>Leave household</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={s.primary} onPress={() => join(generateHouseholdCode())}><Text style={s.primaryText}>Create a household</Text></TouchableOpacity>
            <Text style={[s.label, { textAlign: 'center' }]}>or join one</Text>
            <TextInput style={s.input} value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="Enter code" placeholderTextColor={t.placeholder} maxLength={8} />
            <TouchableOpacity style={s.secondary} onPress={() => join(code)}><Text style={s.secondaryText}>Join</Text></TouchableOpacity>
          </>
        )}
      </View>

      <Text style={s.section}>Business</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Business mode</Text>
            <Text style={s.hint}>For shops, pharmacies and restaurants: batch numbers, suppliers, cost per unit and a printable report.</Text>
          </View>
          <Switch value={settings.businessMode} onValueChange={v => saveSettings({ businessMode: v })} trackColor={{ true: t.green, false: t.track }} />
        </View>
      </View>

      <TouchableOpacity style={s.link} onPress={async () => { await saveSettings({ onboarded: false }); router.replace('/onboarding'); }}>
        <Text style={s.linkText}>Replay the welcome tour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { padding: 20, paddingBottom: 60, backgroundColor: t.bg, flexGrow: 1 },
    section: { color: t.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
    card: { backgroundColor: t.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.border },
    label: { color: t.text, fontWeight: '800', marginTop: 10, marginBottom: 8 },
    input: { backgroundColor: t.input, borderWidth: 1, borderColor: t.border, borderRadius: 14, padding: 14, color: t.text, fontSize: 16 },
    hint: { color: t.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowTitle: { color: t.text, fontSize: 16, fontWeight: '800' },
    step: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.chipActive, alignItems: 'center', justifyContent: 'center' },
    stepText: { color: t.green, fontSize: 22, fontWeight: '800' },
    hour: { color: t.text, fontWeight: '900', fontSize: 17, minWidth: 60, textAlign: 'center' },
    primary: { backgroundColor: t.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondary: { backgroundColor: t.greenSoft, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryText: { color: t.green, fontWeight: '900' },
    danger: { backgroundColor: t.redSoft, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
    dangerText: { color: '#DC2626', fontWeight: '900' },
    link: { alignItems: 'center', padding: 22 },
    linkText: { color: t.green, fontWeight: '800' },
  });
