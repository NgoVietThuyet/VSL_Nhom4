import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet } from 'react-native';
import { COLORS, MOTION } from '../constants/theme';

const useNative = Platform.OS !== 'web';
const PALETTE = [
  COLORS.primaryContainer,
  COLORS.secondaryContainer,
  COLORS.tertiaryContainer,
  COLORS.primaryFixed,
  COLORS.secondaryFixed,
  COLORS.tertiaryFixed,
];

/**
 * Pháo giấy ăn mừng. Đặt trong màn hình, đặt `active` = true để bắn.
 * Không chặn thao tác (pointerEvents none).
 */
export default function Confetti({ active, count = MOTION.confettiCount, onDone }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: PALETTE[i % PALETTE.length],
        size: 7 + Math.random() * 7,
        spreadX: (Math.random() - 0.5) * width * 0.9,
        fall: height * (0.55 + Math.random() * 0.4),
        spin: 360 + Math.random() * 540,
        round: Math.random() > 0.5,
      })),
    // Tạo lại bộ hạt mỗi lần bắn mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, active],
  );

  useEffect(() => {
    if (!active) return undefined;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.confettiMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: useNative,
    });
    anim.start(({ finished }) => {
      if (finished && onDone) onDone();
    });
    return () => anim.stop();
  }, [active, progress, onDone]);

  if (!active) return null;

  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            top: height * 0.12,
            left: width / 2,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.spreadX] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.fall] }) },
              { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </Animated.View>
  );
}
