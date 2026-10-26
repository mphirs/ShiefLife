// NEW app/(tabs)/insights.tsx  -> money saved, waste score, streak (the "screenshot & share" screen)
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { printBusinessReport, shareBusinessReport, valueOf } from '../../lib/businessReport';
import { eventsStore } from '../../lib/events';
import { daysUntilExpiry, productsStore } from '../../lib/products';
import { formatMoney, useSettings } from '../../lib/settings';
import { monthlyStats, shareText } from '../../lib/stats';
import { useList } from '../../lib/store';
import { Theme, useTheme } from '../../lib/theme';

export default function InsightsScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { settings } = useSettings();
  const { items: events } = useList(eventsStore);
  const { items: products } = useList(productsStore);
  const stats = useMemo(() => monthlyStats(events, settings), [events, settings]);
  const month = new Date().toLocaleString('en', { month: 'long' });

  const expired = products.filter(p => daysUntilExpiry(p.expiryDate) < 0);
  const soon = products.filter(p => {
    const d = daysUntilExpiry(p.expiryDate);
    return d >= 0 && d <= 7;
  });
  const atRisk = [...expired, ...soon].reduce((sum, p) => sum + valueOf(p), 0);

  async function runReport(kind: 'share' | 'print') {
    try {
      if (kind === 'share') await shareBusinessReport(products, settings);
      else await printBusinessReport(products, settings);
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not create the report', 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.head}>
          <Text style={s.title}>Insights</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} accessibilityLabel="Settings" style={s.gear}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={s.hero}>
          <Text style={s.heroEyebrow}>{month.toUpperCase()}</Text>
          <Text style={s.heroBig}>You saved {formatMoney(stats.saved, settings.currency)}</Text>
          <Text style={s.heroSub}>by using food before it expired</Text>
          <View style={s.heroRow}>
            <Text style={s.heroPill}>🔥 {stats.streak}-day zero-waste streak</Text>
          </View>
          <TouchableOpacity style={s.shareBtn} onPress={() => Share.share({ message: shareText(stats, settings) })}>
            <Text style={s.shareText}>Share my progress ↗</Text>
          </TouchableOpacity>
        </View>

        <View style={s.grid}>
          <View style={[s.stat, { backgroundColor: t.greenSoft }]}>
            <Text style={s.statNum}>{stats.score === null ? '–' : `${stats.score}%`}</Text>
            <Text style={s.statLabel}>Waste score</Text>
          </View>
          <View style={[s.stat, { backgroundColor: t.greenSoft }]}>
            <Text style={s.statNum}>{stats.used}</Text>
            <Text style={s.statLabel}>Items used</Text>
          </View>
          <View style={[s.stat, { backgroundColor: t.redSoft }]}>
            <Text style={s.statNum}>{stats.thrown}</Text>
            <Text style={s.statLabel}>Thrown out</Text>
          </View>
        </View>
        <Text style={s.note}>
          Lost to waste this month: {formatMoney(stats.wasted, settings.currency)}. Money saved uses the price you enter when adding
          a product, or {formatMoney(settings.avgItemValue, settings.currency)} per item if no price is set (change in Settings).
        </Text>

        {settings.businessMode ? (
          <View style={s.biz}>
            <Text style={s.bizTitle}>🏪 Business report</Text>
            <Text style={s.bizLine}>{products.length} batches in stock</Text>
            <Text style={s.bizLine}>{expired.length} expired · {soon.length} expiring within 7 days</Text>
            <Text style={s.bizLine}>Value at risk: {formatMoney(atRisk, settings.currency)}</Text>
            <View style={s.bizRow}>
              <TouchableOpacity style={s.bizBtn} onPress={() => runReport('print')}><Text style={s.bizBtnText}>🖨 Print</Text></TouchableOpacity>
              <TouchableOpacity style={s.bizBtn} onPress={() => runReport('share')}><Text style={s.bizBtnText}>📄 Save / share PDF</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.bizPromo} onPress={() => router.push('/settings')}>
            <Text style={s.bizPromoText}>🏪 Run a shop, pharmacy or restaurant? Turn on Business mode →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { padding: 20, paddingBottom: 60 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 30, fontWeight: '900', color: t.text },
    gear: { width: 46, height: 46, borderRadius: 16, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.border },
    hero: { backgroundColor: t.hero, borderRadius: 28, padding: 24 },
    heroEyebrow: { color: '#C2E4CC', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    heroBig: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 10, lineHeight: 40 },
    heroSub: { color: '#D5ECDB', fontSize: 14, marginTop: 6 },
    heroRow: { flexDirection: 'row', marginTop: 16 },
    heroPill: { backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: '800', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, overflow: 'hidden' },
    shareBtn: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
    shareText: { color: '#1D5E3C', fontWeight: '900', fontSize: 15 },
    grid: { flexDirection: 'row', gap: 10, marginTop: 14 },
    stat: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
    statNum: { color: t.text, fontSize: 28, fontWeight: '900' },
    statLabel: { color: t.sub, fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
    note: { color: t.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
    biz: { backgroundColor: t.card, borderRadius: 22, padding: 18, marginTop: 20, borderWidth: 1, borderColor: t.border },
    bizTitle: { color: t.text, fontSize: 18, fontWeight: '900', marginBottom: 8 },
    bizLine: { color: t.sub, fontSize: 14, marginTop: 3 },
    bizRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    bizBtn: { flex: 1, backgroundColor: t.greenSoft, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    bizBtnText: { color: t.green, fontWeight: '800' },
    bizPromo: { backgroundColor: t.greenSoft, borderRadius: 18, padding: 16, marginTop: 20 },
    bizPromoText: { color: t.green, fontWeight: '800', lineHeight: 20 },
  });
