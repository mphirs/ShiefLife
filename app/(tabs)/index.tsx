// REPLACES app/(tabs)/index.tsx  -> "Today first" home screen
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionSheet from '../../components/ActionSheet';
import Celebration from '../../components/Celebration';
import EmptyState from '../../components/EmptyState';
import ProductRow from '../../components/ProductRow';
import { deleteProduct, freezeProduct, markThrown, markUsed, restoreProduct } from '../../lib/actions';
import { eventsStore } from '../../lib/events';
import { ShelfProduct, daysUntilExpiry, productsStore } from '../../lib/products';
import { useSettings } from '../../lib/settings';
import { addShoppingItem } from '../../lib/shopping';
import { monthlyStats } from '../../lib/stats';
import { frozenExtension } from '../../lib/shelfLife';
import { useList } from '../../lib/store';
import { Theme, useTheme } from '../../lib/theme';

type Snack = { message: string; actionLabel?: string; onAction?: () => void };

export default function HomeScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { items: products, loading } = useList(productsStore);
  const { items: events } = useList(eventsStore);
  const { settings } = useSettings();

  const [sheet, setSheet] = useState<ShelfProduct | null>(null);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [showLater, setShowLater] = useState(false);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useMemo(
    () => products.map(p => ({ p, days: daysUntilExpiry(p.expiryDate) })).sort((a, b) => a.days - b.days),
    [products],
  );
  const today = rows.filter(r => r.days <= 0);
  const week = rows.filter(r => r.days >= 1 && r.days <= 7);
  const later = rows.filter(r => r.days > 7);
  const stats = useMemo(() => monthlyStats(events, settings), [events, settings]);

  function toast(next: Snack) {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack(next);
    snackTimer.current = setTimeout(() => setSnack(null), 5000);
  }

  async function handleUsed(p: ShelfProduct) {
    const r = await markUsed(p);
    if (r.beforeExpiry) setCelebrate(c => c + 1);
    toast({
      message: `${p.name} used 👏`,
      actionLabel: 'Add to list',
      onAction: async () => {
        await addShoppingItem(p.name);
        toast({ message: `${p.name} added to shopping list 🛒` });
      },
    });
  }

  async function handleDelete(p: ShelfProduct) {
    await deleteProduct(p);
    toast({ message: `${p.name} deleted`, actionLabel: 'Undo', onAction: () => restoreProduct(p) });
  }

  async function handleThrown(p: ShelfProduct) {
    await markThrown(p);
    toast({ message: `${p.name} thrown out. Streak reset.`, actionLabel: 'Undo', onAction: () => restoreProduct(p) });
  }

  async function handleFreeze(p: ShelfProduct) {
    const extra = await freezeProduct(p);
    toast({ message: `❄️ Frozen: +${extra} days for ${p.name}` });
  }

  const sections = [
    { key: 'today', title: 'Use today', subtitle: 'Expired or expiring today', data: today },
    { key: 'week', title: 'This week', subtitle: 'Expiring in the next 7 days', data: week },
    ...(showLater ? [{ key: 'later', title: 'Later', subtitle: 'More than a week away', data: later }] : []),
  ];

  const header = (
    <View>
      <View style={s.topBar}>
        <View>
          <Text style={s.brand}>ShelfLife</Text>
          <Text style={s.caption}>
            {today.length ? `${today.length} to use today` : week.length ? `${week.length} expire this week` : 'All fresh ✨'}
          </Text>
        </View>
        <View style={s.chip} accessibilityLabel={`${stats.streak} day zero waste streak`}>
          <Text style={s.chipText}>🔥 {stats.streak} day{stats.streak === 1 ? '' : 's'}</Text>
        </View>
      </View>
    </View>
  );

  if (!loading && products.length === 0) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={{ padding: 20 }}>
          {header}
          <EmptyState
            emoji="📷"
            title="Scan your first item"
            text="Point your camera at a barcode and ShelfLife fills in the name and a smart expiry date for you."
            primary={{ label: '📷  Scan a barcode', onPress: () => router.push('/scan') }}
            secondary={{ label: 'Or add manually', onPress: () => router.push('/add-product') }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.p.id}
        contentContainerStyle={s.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionSub}>{section.subtitle}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={s.nothing}>
              <Text style={s.nothingText}>
                {section.key === 'today' ? 'Nothing to use today 🎉' : 'Nothing due this week 🌿'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProductRow product={item.p} days={item.days} onPress={setSheet} onUsed={handleUsed} onDelete={handleDelete} />
        )}
        ListFooterComponent={
          later.length > 0 ? (
            <TouchableOpacity style={s.laterBtn} onPress={() => setShowLater(v => !v)}>
              <Text style={s.laterText}>{showLater ? 'Hide later items' : `Show later items (${later.length})`}</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {snack ? (
        <View style={s.snack}>
          <Text style={s.snackText} numberOfLines={2}>{snack.message}</Text>
          {snack.actionLabel ? (
            <TouchableOpacity
              onPress={() => {
                const action = snack.onAction;
                setSnack(null);
                action?.();
              }}
              hitSlop={10}
            >
              <Text style={s.snackAction}>{snack.actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ActionSheet
        visible={!!sheet}
        title={sheet?.name ?? ''}
        subtitle={sheet ? `${sheet.quantity} × ${sheet.category} · ${sheet.expiryDate}` : undefined}
        onClose={() => setSheet(null)}
        actions={
          sheet
            ? [
                { label: 'Used', icon: '✅', onPress: () => handleUsed(sheet) },
                { label: `Frozen (+${frozenExtension(sheet.category)} days)`, icon: '❄️', onPress: () => handleFreeze(sheet) },
                { label: 'Thrown out', icon: '🗑️', onPress: () => handleThrown(sheet) },
                { label: 'Delete (mistake)', icon: '✖️', danger: true, onPress: () => handleDelete(sheet) },
              ]
            : []
        }
      />
      <Celebration trigger={celebrate} />
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 20, paddingBottom: 60 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 6 },
    brand: { fontSize: 30, fontWeight: '900', color: t.text },
    caption: { color: t.muted, fontSize: 14, marginTop: 2, fontWeight: '600' },
    chip: { backgroundColor: t.amberSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
    chipText: { color: t.text, fontWeight: '800', fontSize: 14 },
    sectionHead: { marginTop: 22, marginBottom: 12 },
    sectionTitle: { fontSize: 22, color: t.text, fontWeight: '900' },
    sectionSub: { color: t.muted, fontSize: 12, marginTop: 3 },
    nothing: { backgroundColor: t.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: t.border, alignItems: 'center' },
    nothingText: { color: t.sub, fontWeight: '700', fontSize: 14 },
    laterBtn: { alignItems: 'center', padding: 16, marginTop: 10 },
    laterText: { color: t.green, fontWeight: '800' },
    snack: {
      position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: '#1E3024', borderRadius: 16,
      paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    },
    snackText: { color: '#fff', fontWeight: '600', flex: 1 },
    snackAction: { color: '#7CE0A3', fontWeight: '900' },
  });
