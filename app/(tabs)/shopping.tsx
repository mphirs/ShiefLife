// NEW app/(tabs)/shopping.tsx  -> shopping list (items marked "Used" can be added with one tap)
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import SwipeRow from '../../components/SwipeRow';
import { ShoppingItem, addShoppingItem, clearBought, removeShoppingItem, shoppingStore, toggleShoppingItem } from '../../lib/shopping';
import { useList } from '../../lib/store';
import { Theme, useTheme } from '../../lib/theme';

export default function ShoppingScreen() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const { items } = useList(shoppingStore);
  const [text, setText] = useState('');

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(a.done) - Number(b.done) || b.updatedAt - a.updatedAt),
    [items],
  );
  const bought = items.filter(i => i.done).length;

  async function add() {
    await addShoppingItem(text);
    setText('');
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Text style={s.title}>Shopping list</Text>
          {bought > 0 ? (
            <TouchableOpacity onPress={clearBought}><Text style={s.clear}>Clear bought ({bought})</Text></TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={sorted}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <EmptyState emoji="🛒" title="Your list is empty" text="Mark an item as Used and tap “Add to list”, or type below." />
          }
          renderItem={({ item }: { item: ShoppingItem }) => (
            <SwipeRow onSwipeLeft={() => removeShoppingItem(item.id)} leftLabel="Remove 🗑">
              <View style={s.row}>
                <TouchableOpacity
                  style={[s.check, item.done && s.checkOn]}
                  onPress={() => toggleShoppingItem(item)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={`Mark ${item.name} as bought`}
                >
                  {item.done ? <Text style={s.tick}>✓</Text> : null}
                </TouchableOpacity>
                <Text style={[s.name, item.done && s.nameDone]}>{item.name}</Text>
                {item.done ? (
                  <TouchableOpacity style={s.addShelf} onPress={() => router.push({ pathname: '/add-product', params: { name: item.name } })}>
                    <Text style={s.addShelfText}>Add to shelf</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </SwipeRow>
          )}
        />

        <View style={s.inputBar}>
          <TextInput
            style={s.input} value={text} onChangeText={setText} placeholder="Add an item…"
            placeholderTextColor={t.placeholder} onSubmitEditing={add} returnKeyType="done"
          />
          <TouchableOpacity style={s.addBtn} onPress={add} accessibilityLabel="Add to list">
            <Text style={s.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
    title: { fontSize: 30, fontWeight: '900', color: t.text },
    clear: { color: t.green, fontWeight: '800' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.border },
    check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: t.green, alignItems: 'center', justifyContent: 'center' },
    checkOn: { backgroundColor: t.green },
    tick: { color: '#fff', fontWeight: '900' },
    name: { flex: 1, color: t.text, fontSize: 17, fontWeight: '700' },
    nameDone: { color: t.muted, textDecorationLine: 'line-through' },
    addShelf: { backgroundColor: t.greenSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    addShelfText: { color: t.green, fontWeight: '800', fontSize: 12 },
    inputBar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg },
    input: { flex: 1, backgroundColor: t.input, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 16 },
    addBtn: { width: 54, borderRadius: 16, backgroundColor: t.green, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 26, fontWeight: '600' },
  });
