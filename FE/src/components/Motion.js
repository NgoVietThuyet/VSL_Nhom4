import React, { useRef, useEffect } from 'react';
import { Animated, Platform, Easing } from 'react-native';
import { MOTION } from '../constants/theme';

const useNative = Platform.OS !== 'web';

/** Xuất hiện bằng hiệu ứng nảy (scale + mờ dần). Đổi `popKey` để chạy lại. */
export function PopIn({ children, style, popKey, delay = 0 }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.popDurationMs,
      delay,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: useNative,
    }).start();
  }, [popKey, delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Rung lắc ngang khi `trigger` chuyển sang true (dùng báo đáp án sai). */
export function Shake({ children, style, trigger }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    const d = MOTION.shakeDistance;
    const step = MOTION.shakeStepMs;
    Animated.sequence([
      Animated.timing(x, { toValue: -d, duration: step, useNativeDriver: useNative }),
      Animated.timing(x, { toValue: d, duration: step, useNativeDriver: useNative }),
      Animated.timing(x, { toValue: -d / 2, duration: step, useNativeDriver: useNative }),
      Animated.timing(x, { toValue: d / 2, duration: step, useNativeDriver: useNative }),
      Animated.timing(x, { toValue: 0, duration: step, useNativeDriver: useNative }),
    ]).start();
  }, [trigger, x]);

  return <Animated.View style={[style, { transform: [{ translateX: x }] }]}>{children}</Animated.View>;
}
