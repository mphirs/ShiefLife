import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { categoryInfo } from '../lib/categories';
import { ShelfProduct, expiryLabel, shelfTotalDays } from '../lib/products';
import { Theme, useTheme } from '../lib/theme';
import ExpiryRing from './ExpiryRing';
import SwipeRow from './SwipeRow';

type Props = {
  product: ShelfProduct;
  days: number;
  onPress: (p: ShelfProduct) => void;
  onUsed: (p: ShelfProduct) => void;
  onDelete: (p: ShelfProduct) => void;
};

function ProductRowBase({ product, days, onPress, onUsed, onDelete }: Props) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const cat = categoryInfo(product.category);

  return (
    <SwipeRow onSwipeRight={() => onUsed(product)} onSwipeLeft={() => onDelete(product)}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(product)}
        style={s.row}
        accessibilityLabel={`${product.name}. ${expiryLabel(days)}. Tap for actions, swipe right to mark used, swipe left to delete.`}
      >
        <ExpiryRing days={days} total={shelfTotalDays(product)} />
        <View style={s.details}>
          <Text style={s.name} numberOfLines={2}>{product.name}</Text>
          <Text style={s.meta} numberOfLines={1}>
            {product.quantity} × {product.category}
            {product.frozen ? ' · ❄️ frozen' : ''}
            {product.batchNo ? ` · Batch ${product.batchNo}` : ''}
          </Text>
          <Text style={s.meta}>{expiryLabel(days)} · {product.expiryDate}</Text>
        </View>
        <View style={[s.icon, { backgroundColor: `${cat.color}22` }]}>
          <Text style={s.emoji}>{cat.icon}</Text>
        </View>
      </TouchableOpacity>
    </SwipeRow>
  );
}

export default memo(ProductRowBase);

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
      backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.border,
    },
    details: { flex: 1 },
    name: { color: t.text, fontSize: 16, fontWeight: '800' },
    meta: { color: t.muted, fontSize: 12, marginTop: 3 },
    icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 21 },
  });
