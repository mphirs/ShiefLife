
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ShelfProduct,
  daysUntilExpiry,
  expiryColor,
  expiryLabel,
  getProducts,
} from '../../lib/products';

const GREEN = '#237A4B';
const CREAM = '#F7F8F2';

export default function HomeScreen() {
  const [products, setProducts] = useState<ShelfProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const saved = await getProducts();
      setProducts(saved.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Loading inventory failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  const active = products.length;
  const expired = products.filter(
    p => daysUntilExpiry(p.expiryDate) < 0,
  ).length;
  const expiringSoon = products.filter(p => {
    const days = daysUntilExpiry(p.expiryDate);
    return days >= 0 && days <= 7;
  }).length;

  const attentionProducts = [...products]
    .filter(p => daysUntilExpiry(p.expiryDate) <= 7)
    .sort((a, b) =>
      daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate),
    )
    .slice(0, 5);

  function ProductRow({ item }: { item: ShelfProduct }) {
    const days = daysUntilExpiry(item.expiryDate);
    const color = expiryColor(days);

    return (
      <View style={styles.productRow}>
        <View style={styles.productIcon}>
          <Text style={styles.productEmoji}>
            {item.category === 'Drinks' ? '🥛'
              : item.category === 'Food' ? '🥫'
              : item.category === 'Beauty' ? '🧴'
              : item.category === 'Household' ? '🧼' : '📦'}
          </Text>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productMeta}>
            {item.quantity} item(s) · {item.category}
          </Text>
          <Text style={styles.expiryDate}>
            Expiry: {item.expiryDate}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.statusText, { color }]} numberOfLines={2}>
            {expiryLabel(days)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <FlatList
        data={attentionProducts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProductRow item={item} />}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProducts();
            }}
            tintColor={GREEN}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>S</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>ShelfLife</Text>
                  <Text style={styles.brandCaption}>SMART EXPIRY TRACKER</Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityLabel="Add a product"
                style={styles.topAdd}
                onPress={() => router.push('/add-product')}
              >
                <Text style={styles.topAddText}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroCircle} />
              <Text style={styles.heroEyebrow}>YOUR STOCK, UNDER CONTROL</Text>
              <Text style={styles.heroTitle}>
                Waste less.{'\n'}Save more.
              </Text>
              <Text style={styles.heroSubtitle}>
                Stay ahead of expiry dates and make every product count.
              </Text>

              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => router.push('/add-product')}
              >
                <Text style={styles.heroButtonText}>＋  Add a product</Text>
              </TouchableOpacity>

              <Text style={styles.heroArt}>🌿</Text>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Your overview</Text>
              <Text style={styles.sectionSubtitle}>A little insight goes a long way.</Text>
            </View>

            <View style={styles.stats}>
              <View style={[styles.statCard, styles.statGreen]}>
                <Text style={styles.statEmoji}>📦</Text>
                <Text style={styles.statNumber}>{active}</Text>
                <Text style={styles.statLabel}>Active products</Text>
              </View>

              <View style={[styles.statCard, styles.statAmber]}>
                <Text style={styles.statEmoji}>⏳</Text>
                <Text style={styles.statNumber}>{expiringSoon}</Text>
                <Text style={styles.statLabel}>Due in 7 days</Text>
              </View>

              <View style={[styles.statCard, styles.statRed]}>
                <Text style={styles.statEmoji}>⚠️</Text>
                <Text style={styles.statNumber}>{expired}</Text>
                <Text style={styles.statLabel}>Expired</Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Needs your attention</Text>
                <Text style={styles.sectionSubtitle}>
                  Products approaching or past expiry
                </Text>
              </View>
              <View style={styles.liveDot} />
            </View>

            {loading ? (
              <ActivityIndicator color={GREEN} style={{ margin: 24 }} />
            ) : null}

            {!loading && attentionProducts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>A fresh start!</Text>
                <Text style={styles.emptyText}>
                  No products need attention yet. Add your first product
                  and ShelfLife will help you track its expiry date.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/add-product')}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Add your first product</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!loading && attentionProducts.length > 0 ? (
              <Text style={styles.listHint}>
                Showing up to five products that need attention
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Small steps, less waste 🌍</Text>
            <Text style={styles.footerText}>
              Check dates regularly. Store products correctly and follow
              the manufacturer's safety instructions.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 12, paddingBottom: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: {
    width: 44, height: 44, borderRadius: 15,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 25, color: '#FFFFFF', fontWeight: '900' },
  brandName: { fontSize: 21, fontWeight: '900', color: '#213729' },
  brandCaption: {
    color: '#748174', fontSize: 8, letterSpacing: 1.5,
    fontWeight: '800', marginTop: 2,
  },
  topAdd: {
    width: 43, height: 43, borderRadius: 15,
    backgroundColor: '#E4F1E6', alignItems: 'center', justifyContent: 'center',
  },
  topAddText: { fontSize: 27, color: GREEN, fontWeight: '500', marginTop: -2 },
  hero: {
    backgroundColor: '#1D5E3C', borderRadius: 28,
    padding: 23, overflow: 'hidden', minHeight: 245,
  },
  heroCircle: {
    position: 'absolute', right: -38, top: -48,
    width: 190, height: 190, borderRadius: 100,
    backgroundColor: '#FFFFFF', opacity: 0.06,
  },
  heroEyebrow: {
    color: '#C2E4CC', fontSize: 10,
    fontWeight: '800', letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFFFFF', fontSize: 34,
    fontWeight: '900', lineHeight: 39, marginTop: 13,
  },
  heroSubtitle: {
    color: '#E0F0E4', fontSize: 13,
    lineHeight: 20, marginTop: 9, maxWidth: '83%',
  },
  heroButton: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 13, paddingHorizontal: 16,
    paddingVertical: 12, marginTop: 18,
  },
  heroButtonText: { color: GREEN, fontSize: 13, fontWeight: '800' },
  heroArt: { position: 'absolute', right: 17, bottom: 18, fontSize: 47 },
  sectionHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 27, marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, color: '#24372A', fontWeight: '800' },
  sectionSubtitle: { color: '#7C877D', fontSize: 11, marginTop: 5 },
  stats: { flexDirection: 'row', gap: 9 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 12,
    minHeight: 119, justifyContent: 'center',
  },
  statGreen: { backgroundColor: '#E5F2E6' },
  statAmber: { backgroundColor: '#FFF0D8' },
  statRed: { backgroundColor: '#FCE8E5' },
  statEmoji: { fontSize: 17 },
  statNumber: {
    fontSize: 25, fontWeight: '900', color: '#26382B', marginTop: 9,
  },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#5F6D60', marginTop: 3 },
  liveDot: { width: 9, height: 9, borderRadius: 6, backgroundColor: GREEN },
  listHint: { fontSize: 11, color: '#7C877D', marginBottom: 10 },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E9EEE6', gap: 10,
  },
  productIcon: {
    width: 45, height: 48, borderRadius: 14,
    backgroundColor: '#F1F5EE', alignItems: 'center', justifyContent: 'center',
  },
  productEmoji: { fontSize: 23 },
  productDetails: { flex: 1 },
  productName: { color: '#283A2D', fontSize: 13, fontWeight: '800' },
  productMeta: { color: '#7A857A', fontSize: 10, marginTop: 4 },
  expiryDate: { color: '#7A857A', fontSize: 10, marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 7,
    borderRadius: 10, maxWidth: 100,
  },
  statusText: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  emptyCard: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 22, padding: 23, borderWidth: 1, borderColor: '#E9EEE6',
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#26382B', marginTop: 10 },
  emptyText: { textAlign: 'center', fontSize: 12, lineHeight: 19, color: '#7A857A', marginTop: 8 },
  emptyButton: {
    backgroundColor: GREEN, paddingHorizontal: 17,
    paddingVertical: 12, borderRadius: 12, marginTop: 16,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  footer: {
    marginTop: 23, padding: 17, borderRadius: 17,
    backgroundColor: '#EAF1E7',
  },
  footerTitle: { color: '#2A5637', fontSize: 13, fontWeight: '800' },
  footerText: { color: '#657668', fontSize: 11, lineHeight: 18, marginTop: 6 },
});
