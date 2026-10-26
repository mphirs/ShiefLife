// NEW app/(tabs)/recipes.tsx  -> "Use your tomatoes and eggs tonight."
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import { productsStore } from '../../lib/products';
import { suggestRecipes } from '../../lib/recipes';
import { useList } from '../../lib/store';
import { Theme, useTheme } from '../../lib/theme';

function joinNames(list: string[]) {
  const lower = list.map(n => n.toLowerCase());
  if (lower.length <= 1) return lower.join('');
  return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

export default function RecipesScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { items: products } = useList(productsStore);
  const [open, setOpen] = useState<string | null>(null);
  const matches = useMemo(() => suggestRecipes(products), [products]);
  const top = matches[0];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Cook tonight</Text>
        <Text style={s.sub}>Turn expiring food into dinner.</Text>

        {top ? (
          <View style={s.hero}>
            <Text style={s.heroEyebrow}>TONIGHT'S IDEA</Text>
            <Text style={s.heroTitle}>
              Use your {joinNames(top.expiringUses.length ? top.expiringUses : top.uses)} tonight
            </Text>
            <Text style={s.heroSub}>{top.recipe.emoji} {top.recipe.title} · {top.recipe.minutes} min</Text>
          </View>
        ) : null}

        {matches.length === 0 ? (
          <EmptyState
            emoji="🍳"
            title="No recipe ideas yet"
            text="Add a few ingredients like tomatoes, eggs, bread or rice and ShelfLife will suggest what to cook."
            primary={{ label: 'Add a product', onPress: () => router.push('/add-product') }}
          />
        ) : (
          matches.map(m => {
            const expanded = open === m.recipe.id;
            return (
              <TouchableOpacity key={m.recipe.id} style={s.card} activeOpacity={0.9} onPress={() => setOpen(expanded ? null : m.recipe.id)}>
                <View style={s.cardTop}>
                  <Text style={s.emoji}>{m.recipe.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{m.recipe.title}</Text>
                    <Text style={s.meta}>{m.recipe.minutes} min · Uses your {joinNames(m.uses)}</Text>
                  </View>
                  {m.expiringUses.length ? (
                    <View style={s.badge}><Text style={s.badgeText}>⏳ expiring</Text></View>
                  ) : null}
                </View>
                {m.missing.length ? <Text style={s.missing}>You'll also need: {m.missing.join(', ')}</Text> : <Text style={s.have}>✅ You have everything</Text>}
                <Text style={s.meta}>Usually in your kitchen: {m.recipe.pantry}</Text>
                {expanded ? (
                  <View style={{ marginTop: 10 }}>
                    {m.recipe.steps.map((step, i) => (
                      <Text key={i} style={s.step}>{i + 1}. {step}</Text>
                    ))}
                  </View>
                ) : (
                  <Text style={s.tap}>Tap for steps</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 30, fontWeight: '900', color: t.text, marginTop: 10 },
    sub: { color: t.muted, fontSize: 14, marginTop: 4, marginBottom: 16 },
    hero: { backgroundColor: t.hero, borderRadius: 24, padding: 20, marginBottom: 16 },
    heroEyebrow: { color: '#C2E4CC', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8, lineHeight: 30 },
    heroSub: { color: '#E0F0E4', marginTop: 8, fontSize: 14, fontWeight: '600' },
    card: { backgroundColor: t.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    emoji: { fontSize: 34 },
    cardTitle: { color: t.text, fontSize: 17, fontWeight: '800' },
    meta: { color: t.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
    badge: { backgroundColor: t.amberSoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
    badgeText: { color: t.text, fontSize: 11, fontWeight: '800' },
    missing: { color: '#CA8A04', fontSize: 13, fontWeight: '700', marginTop: 4 },
    have: { color: t.green, fontSize: 13, fontWeight: '800', marginTop: 4 },
    step: { color: t.sub, fontSize: 14, lineHeight: 21, marginBottom: 4 },
    tap: { color: t.green, fontSize: 12, fontWeight: '800', marginTop: 8 },
  });
