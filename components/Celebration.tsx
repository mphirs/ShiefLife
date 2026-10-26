// A brief (about 1 second) burst of emoji when an item is used before it expires.
// Increase the `trigger` number to play it. It never blocks touches.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const EMOJI = ['🎉', '✨', '🌿', '💚', '🎊', '⭐'];
const { width, height } = Dimensions.get('window');

export default function Celebration({ trigger }: { trigger: number }) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const particles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      emoji: EMOJI[i % EMOJI.length],
      x: Math.random() * (width - 40) + 10,
      drift: (Math.random() - 0.5) * 80,
      size: 20 + Math.random() * 16,
    })),
    [trigger], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
      () => setVisible(false),
    );
  }, [trigger, progress]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: height * 0.62,
            fontSize: p.size,
            opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.4] }) },
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.2, 1] }) },
            ],
          }}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}
