// Countdown ring: fills according to how much shelf life is left and turns green -> amber -> red.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { expiryColor } from '../lib/products';
import { useTheme } from '../lib/theme';

type Props = { days: number; total: number; size?: number; stroke?: number };

export default function ExpiryRing({ days, total, size = 66, stroke = 7 }: Props) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = expiryColor(days);
  const progress = days < 0 ? 1 : Math.min(1, Math.max(0.05, days / Math.max(total, 1)));
  const label = days < 0 ? '!' : days > 99 ? '99+' : String(days);
  const unit = days < 0 ? 'late' : days === 1 ? 'day' : 'days';

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days left`}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text maxFontSizeMultiplier={1.15} style={{ color, fontWeight: '900', fontSize: size * 0.3 }}>
          {label}
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={{ color: t.muted, fontSize: size * 0.14, marginTop: -2 }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
