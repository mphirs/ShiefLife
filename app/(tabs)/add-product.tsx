
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { scheduleExpiryReminders } from '../../lib/notifications';
import { ShelfProduct, getProducts, saveProducts } from '../../lib/products';

const GREEN = '#237A4B';
const CREAM = '#F7F8F2';
const MUTED = '#7B857C';

const categories = [
  'Food', 'Drinks', 'Household', 'Beauty', 'Other',
];

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [quantity, setQuantity] = useState('1');

  // Convert a date into YYYY-MM-DD format.
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Store today's date as the initial expiry date.
  const [expiryDate, setExpiryDate] = useState(
    formatDate(new Date())
  );

  // Control whether the calendar is visible.
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [reminders, setReminders] = useState<number[]>([3]);
  const [saving, setSaving] = useState(false);

  function toggleReminder(days: number) {
    setReminders(current =>
      current.includes(days)
        ? current.filter(item => item !== days)
        : [...current, days].sort((a, b) => b - a),
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Product name required', 'Enter the name of your product.');
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      Alert.alert('Invalid quantity', 'Enter a whole number greater than zero.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('Expiry date required', 'Use YYYY-MM-DD, for example 2026-11-15.');
      return;
    }

    const [year, month, day] = expiryDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const validDate =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!validDate) {
      Alert.alert('Invalid date', 'Enter a real calendar date.');
      return;
    }

    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiry < today) {
      Alert.alert('Past expiry date', 'Enter today or a future date.');
      return;
    }

    if (reminders.length === 0) {
      Alert.alert('Choose a reminder', 'Select 2, 3 or 7 days before expiry.');
      return;
    }

    setSaving(true);

    try {
      const product: ShelfProduct = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        category,
        quantity: parsedQuantity,
        expiryDate,
        reminderDays: reminders,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const notificationIds = await scheduleExpiryReminders(
        product.name,
        product.expiryDate,
        product.reminderDays,
      );

      product.notificationIds = notificationIds;

      const existing = await getProducts();
      await saveProducts([...existing, product]);

      Alert.alert(
        'Product saved',
        notificationIds.length
          ? 'Your product has been saved and its upcoming phone reminders have been scheduled.'
          : 'Your product has been saved. No future local reminders were scheduled. Check notification permission and the selected dates.',
        [{ text: 'Continue', onPress: () => router.replace('/') }],
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        <Text style={styles.eyebrow}>YOUR INVENTORY</Text>
        <Text style={styles.title}>Add a product</Text>
        <Text style={styles.subtitle}>
          Keep track today. Waste less tomorrow.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Product name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Fresh milk"
            placeholderTextColor="#A0A89F"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.wrap}>
            {categories.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, category === item && styles.chipActive]}
              >
                <Text style={[
                  styles.chipText,
                  category === item && styles.chipTextActive,
                ]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#A0A89F"
          />

          <Text style={styles.label}>Expiry date</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD (e.g. 2026-11-15)"
            placeholderTextColor="#A0A89F"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={styles.hint}>
            Enter the date printed on the product packaging.
          </Text>

          <Text style={styles.label}>Remind me before expiry</Text>
          <View style={styles.wrap}>
            {[2, 3, 7].map(days => (
              <TouchableOpacity
                key={days}
                onPress={() => toggleReminder(days)}
                style={[
                  styles.reminder,
                  reminders.includes(days) && styles.reminderActive,
                ]}
              >
                <Text style={[
                  styles.reminderText,
                  reminders.includes(days) && styles.reminderTextActive,
                ]}>{days} days</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>
            Select one or more reminders.
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving product...' : 'Save product  →'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  container: { padding: 22, paddingBottom: 42 },
  eyebrow: {
    color: GREEN, fontSize: 11, fontWeight: '800',
    letterSpacing: 2, marginTop: 12,
  },
  title: {
    fontSize: 30, fontWeight: '800', color: '#1E3024',
    marginTop: 8,
  },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 7, marginBottom: 22 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 20, borderWidth: 1, borderColor: '#E9EEE6',
  },
  label: {
    fontSize: 14, fontWeight: '700', color: '#283B2D',
    marginTop: 18, marginBottom: 9,
  },
  input: {
    backgroundColor: '#F8FAF6', borderWidth: 1, borderColor: '#E4EAE0',
    borderRadius: 13, paddingHorizontal: 14, paddingVertical: 14,
    color: '#25372A', fontSize: 15,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F3F5F0', borderWidth: 1, borderColor: '#E5EAE2',
  },
  chipActive: { backgroundColor: '#E0F2E5', borderColor: GREEN },
  chipText: { color: '#566358', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: GREEN },
  hint: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 7 },
  reminder: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E9DF', backgroundColor: '#FAFBF8',
  },
  reminderActive: { backgroundColor: GREEN, borderColor: GREEN },
  reminderText: { fontWeight: '700', color: '#526052' },
  reminderTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: GREEN, borderRadius: 15, padding: 17,
    alignItems: 'center', marginTop: 28,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
