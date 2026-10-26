// components/DateTimeField.tsx
import DateTimePicker, {
    DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
};

export default function DateTimeField({ label, value, onChange }: Props) {
  // which picker is open: 'date' | 'time' | null
  const [mode, setMode] = useState<null | 'date' | 'time'>(null);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    // Android auto-closes the dialog
    if (Platform.OS === 'android') setMode(null);
    if (event.type === 'dismissed' || !selected) return;

    if (mode === 'date') {
      // keep the existing time, only swap the calendar day
      const next = new Date(value);
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
      onChange(next);
    } else if (mode === 'time') {
      // keep the existing date, only swap hours + minutes
      const next = new Date(value);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(next);
    }
  }

  const dateLabel = value.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <Pressable
          style={[styles.btn, { flex: 2 }]}
          onPress={() => setMode('date')}
        >
          <Text style={styles.btnIcon}>📅</Text>
          <Text style={styles.btnText}>{dateLabel}</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, { flex: 1 }]}
          onPress={() => setMode('time')}
        >
          <Text style={styles.btnIcon}>⏰</Text>
          <Text style={styles.btnText}>{timeLabel}</Text>
        </Pressable>
      </View>

      {/* Android: native dialog */}
      {mode !== null && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour={false}
          display="default"
          onChange={handleChange}
        />
      )}

      {/* iOS: inline spinner + Done button */}
      {mode !== null && Platform.OS === 'ios' && (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="spinner"
            onChange={handleChange}
          />
          <Pressable style={styles.done} onPress={() => setMode(null)}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B6570',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F5F7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 6,
  },
  btnIcon: { fontSize: 16 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#0B1F2A' },
  iosPicker: {
    backgroundColor: '#F3F5F7',
    borderRadius: 12,
    marginTop: 8,
    paddingBottom: 8,
  },
  done: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneText: { color: '#0A84FF', fontWeight: '700', fontSize: 15 },
});