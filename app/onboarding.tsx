// NEW app/onboarding.tsx  -> 3 screens, ending with "allow notifications" + "scan your first item"
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { prepareNotifications, refreshReminders } from '../lib/notifications';
import { saveSettings } from '../lib/settings';
import { Theme, useTheme } from '../lib/theme';

const PAGES = [
  { emoji: '📷', title: 'Scan, don’t type', text: 'Scan a barcode or a receipt. ShelfLife fills in the name and a smart expiry date for you.' },
  { emoji: '⭕', title: 'Know what to use today', text: 'Colour rings show at a glance what is fresh, what is running out and what to cook tonight.' },
  { emoji: '🔔', title: 'One gentle reminder', text: 'A single morning summary instead of lots of pings, with a Snooze button when you are busy.' },
];

export default function Onboarding() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const [page, setPage] = useState(0);
  const [asked, setAsked] = useState(false);
  const last = page === PAGES.length - 1;
  const p = PAGES[page];

  async function finish(goScan: boolean) {
    await saveSettings({ onboarded: true });
    await refreshReminders();
    setTimeout(() => router.push(goScan ? '/scan' : '/'), 250);
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.skipRow}>
        {!last ? (
          <TouchableOpacity onPress={() => finish(false)} hitSlop={12}><Text style={s.skip}>Skip</Text></TouchableOpacity>
        ) : null}
      </View>

      <View style={s.body}>
        <Text style={s.emoji}>{p.emoji}</Text>
        <Text style={s.title}>{p.title}</Text>
        <Text style={s.text}>{p.text}</Text>
      </View>

      <View style={s.dots}>
        {PAGES.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotOn]} />)}
      </View>

      <View style={s.footer}>
        {!last ? (
          <TouchableOpacity style={s.primary} onPress={() => setPage(page + 1)}><Text style={s.primaryText}>Next</Text></TouchableOpacity>
        ) : (
          <>
            {!asked ? (
              <TouchableOpacity style={s.primary} onPress={async () => { await prepareNotifications(); setAsked(true); }}>
                <Text style={s.primaryText}>Allow notifications</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.primary} onPress={() => finish(true)}><Text style={s.primaryText}>📷  Scan my first item</Text></TouchableOpacity>
            )}
            <TouchableOpacity style={s.later} onPress={() => finish(false)}><Text style={s.laterText}>{asked ? 'I’ll add items later' : 'Not now'}</Text></TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg, padding: 24 },
    skipRow: { height: 36, alignItems: 'flex-end' },
    skip: { color: t.muted, fontWeight: '800', fontSize: 15 },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 96 },
    title: { color: t.text, fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 24 },
    text: { color: t.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.track },
    dotOn: { width: 26, backgroundColor: t.green },
    footer: { paddingBottom: 10 },
    primary: { backgroundColor: t.green, borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900', fontSize: 17 },
    later: { alignItems: 'center', padding: 16 },
    laterText: { color: t.muted, fontWeight: '700' },
  });
