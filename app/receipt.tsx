// NEW app/receipt.tsx  -> snap a receipt, review the detected groceries, add them all at once.
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDays, todayISO } from '../lib/dates';
import { refreshReminders } from '../lib/notifications';
import { addProduct, newId } from '../lib/products';
import { ReceiptItem, ocrReceipt, parseReceiptText } from '../lib/receipt';
import { Theme, useTheme } from '../lib/theme';

export default function ReceiptScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<ReceiptItem[] | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasted, setPasted] = useState('');

  async function process(base64?: string | null) {
    if (!base64) return;
    setBusy(true);
    try {
      const text = await ocrReceipt(base64);
      const found = parseReceiptText(text);
      if (found.length === 0) {
        Alert.alert('No items found', 'Try a clearer, flatter photo in good light, or paste the receipt text instead.');
      }
      setItems(found);
    } catch (e: any) {
      Alert.alert('Could not read the receipt', `${e?.message ?? 'Check your internet connection.'}\n\nYou can also paste the receipt text.`);
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera permission needed', 'Allow camera access to scan receipts.');
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (!r.canceled) await process(r.assets[0].base64);
  }

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, mediaTypes: ['images'] });
    if (!r.canceled) await process(r.assets[0].base64);
  }

  function update(key: string, patch: Partial<ReceiptItem>) {
    setItems(list => (list ?? []).map(i => (i.key === key ? { ...i, ...patch } : i)));
  }

  async function addAll() {
    const chosen = (items ?? []).filter(i => i.include && i.name.trim());
    if (chosen.length === 0) return Alert.alert('Nothing selected', 'Switch on at least one item.');
    setBusy(true);
    try {
      for (const i of chosen) {
        await addProduct({
          id: newId(),
          name: i.name.trim(),
          category: i.category,
          quantity: i.quantity,
          expiryDate: addDays(todayISO(), i.days),
          createdAt: new Date().toISOString(),
          status: 'active',
          price: i.price,
        });
      }
      await refreshReminders();
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={t.green} />
        <Text style={s.centerText}>Working on it…</Text>
      </View>
    );
  }

  if (!items) {
    return (
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.emoji}>🧾</Text>
        <Text style={s.title}>Add a whole shop at once</Text>
        <Text style={s.text}>Take a photo of your receipt. ShelfLife finds the groceries and suggests an expiry date for each. You review before anything is saved.</Text>
        <TouchableOpacity style={s.primary} onPress={takePhoto}><Text style={s.primaryText}>📷  Take a photo</Text></TouchableOpacity>
        <TouchableOpacity style={s.secondary} onPress={pickPhoto}><Text style={s.secondaryText}>🖼  Choose from gallery</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPasteMode(v => !v)}><Text style={s.link}>{pasteMode ? 'Hide' : 'Or paste receipt text'}</Text></TouchableOpacity>
        {pasteMode ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              style={[s.input, { height: 150, textAlignVertical: 'top' }]} multiline value={pasted} onChangeText={setPasted}
              placeholder={'MILK 1L     2,450\nEGGS TRAY   5,900\nTOMATOES    1,200'} placeholderTextColor={t.placeholder}
            />
            <TouchableOpacity style={s.primary} onPress={() => setItems(parseReceiptText(pasted))}><Text style={s.primaryText}>Find items</Text></TouchableOpacity>
          </View>
        ) : null}
        <Text style={s.tip}>Tip: lay the receipt flat, in good light. Printed receipts work best.</Text>
      </ScrollView>
    );
  }

  const count = items.filter(i => i.include).length;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Review {items.length} items</Text>
        <Text style={s.text}>Fix names, switch off anything that is not food, and adjust the days.</Text>
        {items.map(i => (
          <View key={i.key} style={[s.row, !i.include && { opacity: 0.45 }]}>
            <Switch value={i.include} onValueChange={v => update(i.key, { include: v })} trackColor={{ true: t.green, false: t.track }} />
            <View style={{ flex: 1 }}>
              <TextInput style={s.nameInput} value={i.name} onChangeText={v => update(i.key, { name: v })} />
              <Text style={s.meta}>{i.category}{i.price ? ` · ${i.price}` : ''}</Text>
            </View>
            <View style={s.days}>
              <TouchableOpacity onPress={() => update(i.key, { days: Math.max(1, i.days - 1) })} hitSlop={8}><Text style={s.dayBtn}>−</Text></TouchableOpacity>
              <Text style={s.dayNum}>{i.days}d</Text>
              <TouchableOpacity onPress={() => update(i.key, { days: i.days + 1 })} hitSlop={8}><Text style={s.dayBtn}>＋</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={s.bar}>
        <TouchableOpacity style={s.primary} onPress={addAll}><Text style={s.primaryText}>Add {count} item{count === 1 ? '' : 's'} to my shelf</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { padding: 20, paddingBottom: 40, backgroundColor: t.bg, flexGrow: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    centerText: { color: t.sub, marginTop: 12, fontWeight: '700' },
    emoji: { fontSize: 56, textAlign: 'center', marginTop: 10 },
    title: { fontSize: 24, fontWeight: '900', color: t.text, textAlign: 'center', marginTop: 8 },
    text: { color: t.muted, textAlign: 'center', lineHeight: 21, marginTop: 8, marginBottom: 18 },
    primary: { backgroundColor: t.green, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 10 },
    primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    secondary: { backgroundColor: t.greenSoft, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 10 },
    secondaryText: { color: t.green, fontWeight: '900', fontSize: 16 },
    link: { color: t.green, fontWeight: '800', textAlign: 'center', padding: 18 },
    tip: { color: t.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
    input: { backgroundColor: t.input, borderWidth: 1, borderColor: t.border, borderRadius: 14, padding: 14, color: t.text, fontSize: 15 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: t.border, marginTop: 10 },
    nameInput: { color: t.text, fontSize: 16, fontWeight: '800', padding: 0 },
    meta: { color: t.muted, fontSize: 12, marginTop: 3 },
    days: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dayBtn: { color: t.green, fontSize: 22, fontWeight: '800' },
    dayNum: { color: t.text, fontWeight: '800', minWidth: 38, textAlign: 'center' },
    bar: { padding: 16, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg },
  });
