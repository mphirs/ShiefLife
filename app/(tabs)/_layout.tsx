import { Tabs } from 'expo-router';

const GREEN = '#237A4B';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#8A958B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EDE5',
          height: 65,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="⌂" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Add product',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="＋" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const { Text } = require('react-native');
  return (
    <Text style={{ color, fontSize: size + 5, fontWeight: '700' }}>
      {name}
    </Text>
  );
}