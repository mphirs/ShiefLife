// REPLACES app/(tabs)/_layout.tsx
// 5 tabs: Today | Recipes | [big + button] | List | Insights
import { Tabs } from 'expo-router';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{icon}</Text>;
}

// The big centre button: always reachable with the thumb.
function AddButton({ onPress }: { onPress?: (e: GestureResponderEvent) => void }) {
  const t = useTheme();
  return (
    <View style={styles.addWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add a product"
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.addBtn, { backgroundColor: t.green, borderColor: t.tabBar }]}
      >
        <Text style={styles.addPlus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.green,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.tabBar, borderTopColor: t.border, height: 68, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes', tabBarIcon: ({ focused }) => <TabIcon icon="🍳" focused={focused} /> }} />
      <Tabs.Screen
        name="add-product"
        options={{ title: 'Add product', tabBarLabel: () => null, tabBarButton: props => <AddButton onPress={props.onPress as any} /> }}
      />
      <Tabs.Screen name="shopping" options={{ title: 'List', tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addWrap: { flex: 1, alignItems: 'center' },
  addBtn: {
    width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center',
    marginTop: -24, borderWidth: 4, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  addPlus: { color: '#fff', fontSize: 32, fontWeight: '500', marginTop: -3 },
});
