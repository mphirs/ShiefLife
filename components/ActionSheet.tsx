import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../lib/theme';

export type SheetAction = { label: string; icon: string; onPress: () => void; danger?: boolean };

type Props = { visible: boolean; title: string; subtitle?: string; actions: SheetAction[]; onClose: () => void };

export default function ActionSheet({ visible, title, subtitle, actions, onClose }: Props) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <Text style={s.title} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          {actions.map(a => (
            <TouchableOpacity
              key={a.label}
              style={s.action}
              onPress={() => {
                onClose();
                a.onPress();
              }}
            >
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={[s.actionText, a.danger && { color: '#DC2626' }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancel} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: t.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: t.track, marginBottom: 14 },
    title: { color: t.text, fontSize: 19, fontWeight: '800' },
    subtitle: { color: t.muted, fontSize: 13, marginTop: 4, marginBottom: 8 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    actionIcon: { fontSize: 22 },
    actionText: { color: t.text, fontSize: 17, fontWeight: '700' },
    cancel: { alignItems: 'center', paddingVertical: 16, marginTop: 6 },
    cancelText: { color: t.muted, fontSize: 16, fontWeight: '700' },
  });
