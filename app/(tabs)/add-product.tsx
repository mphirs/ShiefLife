// REPLACES app/(tabs)/add-product.tsx
// Add in under 5 seconds: scan (or type 2 letters) -> accept the suggested date -> Save.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rememberBarcode } from '../../lib/barcode';
import { CATEGORIES } from '../../lib/categories';
import { addDays, daysBetween, isValidISODate, todayISO } from '../../lib/dates';
import { refreshReminders } from '../../lib/notifications';
import { addProduct, newId } from '../../lib/products';
import { useSettings } from '../../lib/settings';
import { CATEGORY_DEFAULT_DAYS, searchShelfLife, suggestShelfLife } from '../../lib/shelfLife';
import { Theme, useTheme } from '../../lib/theme';

const QUICK = [
  { label: '+3 d', n: 3 }, { label: '+1 wk', n: 7 }, { label: '+2 wk', n: 14 },
  { label: '+1 mo', n: 30 }, { label: '+3 mo', n: 90 }, { label: '+1 yr', n: 365 },
];

export default function AddProductScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { settings } = useSettings();
  const params = useLocalSearchParams<{ name?: string; category?: string; barcode?: string; days?: string }>();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [quantity, setQuantity] = useState(1);
  const [expiry, setExpiry] = useState(addDays(todayISO(), 7));
  const [dateTouched, setDateTouched] = useState(false);
  const [hint, setHint] = useState('');
  const [barcode, setBarcode] = useState<string | undefined>();
  const [price, setPrice] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);

  // Values coming from the barcode scanner / shopping list
  useEffect(() => {
    if (!params.name && !params.barcode) return;
    if (params.name) setName(String(params.name));
    if (params.category) setCategory(String(params.category));
    if (params.barcode) setBarcode(String(params.barcode));
    if (params.days) {
      setExpiry(addDays(todayISO(), Number(params.days)));
      setHint(`Suggested ${params.days} days. Adjust if the pack says otherwise.`);
      setDateTouched(false);
    } else if (params.name) {
      applySuggestion(String(params.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.name, params.barcode, params.days, params.category]);

  function applySuggestion(text: string) {
    const guess = suggestShelfLife(text);
    if (guess) {
      setCategory(guess.category);
      setExpiry(addDays(todayISO(), guess.days));
      setHint(`Suggested ${guess.days} days for ${guess.name.toLowerCase()}. Adjust if needed.`);
    }
  }

  function onChangeName(text: string) {
    setName(text);
    if (!dateTouched) applySuggestion(text);
  }

  function setDate(next: string, touched = true) {
    setExpiry(next);
    if (touched) {
      setDateTouched(true);
      setHint('');
    }
  }

  function stepDate(n: number) {
    const base = isValidISODate(expiry) ? expiry : todayISO();
    setDate(addDays(base, n));
  }

  const suggestions = name.trim().length >= 2 ? searchShelfLife(name).filter(e => e.name.toLowerCase() !== name.trim().toLowerCase()) : [];
  const daysLeft = isValidISODate(expiry) ? daysBetween(todayISO(), expiry) : null;

  function reset() {
    setName(''); setCategory('Pantry'); setQuantity(1); setExpiry(addDays(todayISO(), 7));
    setDateTouched(false); setHint(''); setBarcode(undefined); setPrice(''); setBatchNo(''); setSupplier(''); setUnitCost('');
  }

  async function handleSave() {
    if (!name.trim()) return Alert.alert('Product name required', 'Type or scan the product first.');
    if (!isValidISODate(expiry)) return Alert.alert('Check the date', 'Use YYYY-MM-DD, for example 2026-11-15.');
    if (daysBetween(todayISO(), expiry) < 0) return Alert.alert('Past expiry date', 'Enter today or a future date.');

    setSaving(true);
    try {
      const priceNum = price.trim() ? Number(price.replace(/,/g, '')) : undefined;
      const costNum = unitCost.trim() ? Number(unitCost.replace(/,/g, '')) : undefined;
      await addProduct({
        id: newId(),
        name: name.trim(),
        category,
        quantity,
        expiryDate: expiry,
        createdAt: new Date().toISOString(),
        status: 'active',
        price: priceNum && !Number.isNaN(priceNum) ? priceNum : undefined,
        barcode,
        batchNo: batchNo.trim() || undefined,
        supplier: supplier.trim() || undefined,
        unitCost: costNum && !Number.isNaN(costNum) ? costNum : undefined,
      });
      if (barcode) {
        await rememberBarcode(barcode, {
          name: name.trim(), category,
          days: Math.max(1, daysBetween(todayISO(), expiry)) || CATEGORY_DEFAULT_DAYS[category] || 30,
        });
      }
      await refreshReminders();
      reset();
      router.replace('/');
    } catch (e) {
      console.error(e);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Add a product</Text>

          <View style={s.scanRow}>
            <TouchableOpacity style={[s.scanBtn, { backgroundColor: t.green }]} onPress={() => router.push('/scan')}>
              <Text style={s.scanIcon}>📷</Text>
              <Text style={s.scanTextWhite}>Scan barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.scanBtn, { backgroundColor: t.greenSoft }]} onPress={() => router.push('/receipt')}>
              <Text style={s.scanIcon}>🧾</Text>
              <Text style={s.scanText}>Scan receipt</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Product name</Text>
            <TextInput
              style={s.input} value={name} onChangeText={onChangeName}
              placeholder="Start typing, e.g. milk" placeholderTextColor={t.placeholder}
              autoCapitalize="sentences"
            />
            {suggestions.length > 0 ? (
              <View style={s.wrap}>
                {suggestions.map(e => (
                  <TouchableOpacity
                    key={e.name} style={s.suggest}
                    onPress={() => {
                      setName(e.name); setCategory(e.category); setDateTouched(false);
                      setExpiry(addDays(todayISO(), e.days));
                      setHint(`Suggested ${e.days} days for ${e.name.toLowerCase()}. Adjust if needed.`);
                    }}
                  >
                    <Text style={s.suggestText}>{e.name} · {e.days}d</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={s.label}>Expiry date</Text>
            <View style={s.dateRow}>
              <TouchableOpacity style={s.stepBtn} onPress={() => stepDate(-1)} accessibilityLabel="One day earlier">
                <Text style={s.stepText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[s.input, s.dateInput]} value={expiry} onChangeText={v => setDate(v)}
                keyboardType="numbers-and-punctuation" maxLength={10} placeholder="YYYY-MM-DD" placeholderTextColor={t.placeholder}
              />
              <TouchableOpacity style={s.stepBtn} onPress={() => stepDate(1)} accessibilityLabel="One day later">
                <Text style={s.stepText}>＋</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>
              {daysLeft !== null ? `${daysLeft === 0 ? 'Expires today' : daysLeft < 0 ? 'Already past' : `In ${daysLeft} days`}. ` : ''}
              {hint}
            </Text>
            <View style={s.wrap}>
              {QUICK.map(q => (
                <TouchableOpacity key={q.label} style={s.chip} onPress={() => setDate(addDays(todayISO(), q.n))}>
                  <Text style={s.chipText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Quantity</Text>
            <View style={s.dateRow}>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))} accessibilityLabel="Decrease quantity">
                <Text style={s.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={s.qty}>{quantity}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(q => q + 1)} accessibilityLabel="Increase quantity">
                <Text style={s.stepText}>＋</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Category</Text>
            <View style={s.wrap}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} style={[s.chip, category === c.key && s.chipActive]}>
                  <Text style={[s.chipText, category === c.key && { color: t.green }]}>{c.icon} {c.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Price paid ({settings.currency}) · optional</Text>
            <TextInput
              style={s.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad"
              placeholder="Used to calculate money saved" placeholderTextColor={t.placeholder}
            />

            {settings.businessMode ? (
              <>
                <Text style={s.label}>Batch number</Text>
                <TextInput style={s.input} value={batchNo} onChangeText={setBatchNo} placeholder="e.g. B2026-114" placeholderTextColor={t.placeholder} />
                <Text style={s.label}>Supplier</Text>
                <TextInput style={s.input} value={supplier} onChangeText={setSupplier} placeholder="e.g. Chipiku Wholesale" placeholderTextColor={t.placeholder} />
                <Text style={s.label}>Cost per unit ({settings.currency})</Text>
                <TextInput style={s.input} value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={t.placeholder} />
              </>
            ) : null}
          </View>
        </ScrollView>

        {/* Sticky, thumb-friendly save button */}
        <View style={s.saveBar}>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={s.saveText}>{saving ? 'Saving…' : 'Save product  →'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    container: { padding: 20, paddingBottom: 30 },
    title: { fontSize: 30, fontWeight: '900', color: t.text, marginBottom: 14 },
    scanRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    scanBtn: { flex: 1, borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 4 },
    scanIcon: { fontSize: 28 },
    scanTextWhite: { color: '#fff', fontWeight: '800', fontSize: 15 },
    scanText: { color: t.green, fontWeight: '800', fontSize: 15 },
    card: { backgroundColor: t.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: t.border },
    label: { fontSize: 14, fontWeight: '800', color: t.text, marginTop: 18, marginBottom: 9 },
    input: {
      backgroundColor: t.input, borderWidth: 1, borderColor: t.border, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 14, color: t.text, fontSize: 16,
    },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    suggest: { backgroundColor: t.greenSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    suggestText: { color: t.green, fontWeight: '800', fontSize: 13 },
    chip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20, backgroundColor: t.chip, borderWidth: 1, borderColor: t.border },
    chipActive: { backgroundColor: t.chipActive, borderColor: t.green },
    chipText: { color: t.sub, fontSize: 13, fontWeight: '700' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
    stepBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: t.chipActive, alignItems: 'center', justifyContent: 'center' },
    stepText: { color: t.green, fontSize: 26, fontWeight: '800', marginTop: -2 },
    qty: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '900', color: t.text },
    hint: { color: t.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
    saveBar: { padding: 16, paddingBottom: 18, backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.border },
    saveBtn: { backgroundColor: t.green, borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
    saveText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  });
