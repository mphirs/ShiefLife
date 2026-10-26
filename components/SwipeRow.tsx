// One-hand gestures with no extra libraries:
//   swipe RIGHT -> onSwipeRight (e.g. "Used")      swipe LEFT -> onSwipeLeft (e.g. "Delete")
import { ReactNode, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string; // shown while swiping right
  leftLabel?: string; // shown while swiping left
};

const THRESHOLD = 90;
const WIDTH = Dimensions.get('window').width;

export default function SwipeRow({ children, onSwipeRight, onSwipeLeft, rightLabel = '✓ Used', leftLabel = 'Delete 🗑' }: Props) {
  const x = useRef(new Animated.Value(0)).current;
  const handlers = useRef({ onSwipeRight, onSwipeLeft });
  handlers.current = { onSwipeRight, onSwipeLeft };

  const springBack = () => Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();

  const fire = (dir: 1 | -1) => {
    Animated.timing(x, { toValue: dir * WIDTH, duration: 160, useNativeDriver: false }).start(() => {
      if (dir === 1) handlers.current.onSwipeRight?.();
      else handlers.current.onSwipeLeft?.();
      x.setValue(0);
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const canRight = !!handlers.current.onSwipeRight;
        const canLeft = !!handlers.current.onSwipeLeft;
        if ((g.dx > 0 && canRight) || (g.dx < 0 && canLeft)) x.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD && handlers.current.onSwipeRight) fire(1);
        else if (g.dx < -THRESHOLD && handlers.current.onSwipeLeft) fire(-1);
        else springBack();
      },
      onPanResponderTerminate: springBack,
    }),
  ).current;

  const rightOpacity = x.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });
  const leftOpacity = x.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.bg, styles.bgRight, { opacity: rightOpacity }]}>
        <Text style={styles.bgText}>{rightLabel}</Text>
      </Animated.View>
      <Animated.View style={[styles.bg, styles.bgLeft, { opacity: leftOpacity }]}>
        <Text style={styles.bgText}>{leftLabel}</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10, borderRadius: 20, overflow: 'hidden' },
  bg: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: 22 },
  bgRight: { backgroundColor: '#237A4B', alignItems: 'flex-start' },
  bgLeft: { backgroundColor: '#DC2626', alignItems: 'flex-end' },
  bgText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
