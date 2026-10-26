import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../lib/theme';

type Props = {
  emoji: string;
  title: string;
  text: string;
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
};

export default function EmptyState({ emoji, title, text, primary, secondary }: Props) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={s.card}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.text}>{text}</Text>
      {primary ? (
        <TouchableOpacity style={s.primary} onPress={primary.onPress}>
          <Text style={s.primaryText}>{primary.label}</Text>
        </TouchableOpacity>
      ) : null}
      {secondary ? (
        <TouchableOpacity style={s.secondary} onPress={secondary.onPress}>
          <Text style={s.secondaryText}>{secondary.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: t.card, borderRadius: 26, padding: 26, borderWidth: 1, borderColor: t.border, marginTop: 8 },
    emoji: { fontSize: 56 },
    title: { fontSize: 22, fontWeight: '900', color: t.text, marginTop: 12, textAlign: 'center' },
    text: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: t.muted, marginTop: 8 },
    primary: { backgroundColor: t.green, paddingHorizontal: 24, paddingVertical: 15, borderRadius: 16, marginTop: 20, alignSelf: 'stretch', alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    secondary: { paddingVertical: 14, marginTop: 4 },
    secondaryText: { color: t.green, fontWeight: '800', fontSize: 14 },
  });
