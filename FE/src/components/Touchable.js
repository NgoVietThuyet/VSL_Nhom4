import React, { useRef, useState, useEffect } from 'react';
import { Animated, Pressable, Platform, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, MOTION } from '../constants/theme';
import { feedback } from '../utils/feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === 'web';

/**
 * Thay thế TouchableOpacity với cùng cách dùng (style, onPress, disabled, children...).
 * Bổ sung:
 *  - Hover (web / chuột): phóng nhẹ, nổi bóng, phủ lớp màu để biết đang trỏ vào đâu.
 *  - Nhấn: co nảy (spring) + lớp phủ đậm hơn.
 *  - Rung nhẹ khi bấm trên điện thoại (haptic).
 *  - Disabled: mờ đi, con trỏ "not-allowed", không phản hồi.
 *
 * Props thêm: haptic = 'tap' | 'light' | 'success' | 'warning' | 'error' | false
 */
export default function Touchable({
  style,
  children,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled = false,
  haptic = 'tap',
  accessibilityRole = 'button',
  activeOpacity, // giữ để tương thích TouchableOpacity, không dùng
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const flat = StyleSheet.flatten(style) || {};
  const hasShadow = flat.shadowOpacity != null || flat.elevation != null;

  useEffect(() => {
    let target = 1;
    if (!disabled) {
      if (pressed) target = MOTION.pressScale;
      else if (hovered) target = MOTION.hoverScale;
    }
    Animated.spring(scale, {
      toValue: target,
      speed: MOTION.springSpeed,
      bounciness: MOTION.springBounciness,
      useNativeDriver: !isWeb,
    }).start();
  }, [hovered, pressed, disabled, scale]);

  const handlePress = (e) => {
    if (disabled) return;
    if (haptic && feedback[haptic]) feedback[haptic]();
    if (onPress) onPress(e);
  };

  const overlayColor = pressed ? COLORS.pressedOverlay : hovered ? COLORS.hoverOverlay : null;
  const showOverlay = !disabled && overlayColor;

  const composed = [
    flat,
    !disabled && hovered && hasShadow ? SHADOWS.lg : null,
    disabled ? { opacity: 0.55 } : null,
    isWeb ? { cursor: disabled ? 'not-allowed' : 'pointer' } : null,
    { transform: [...(Array.isArray(flat.transform) ? flat.transform : []), { scale }] },
  ];

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      {...rest}
      disabled={disabled}
      style={composed}
      onPress={handlePress}
      onPressIn={(e) => {
        setPressed(true);
        if (onPressIn) onPressIn(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        if (onPressOut) onPressOut(e);
      }}
      onHoverIn={(e) => {
        setHovered(true);
        if (onHoverIn) onHoverIn(e);
      }}
      onHoverOut={(e) => {
        setHovered(false);
        if (onHoverOut) onHoverOut(e);
      }}
    >
      {children}
      {showOverlay && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: overlayColor, borderRadius: flat.borderRadius ?? RADIUS.sm },
          ]}
        />
      )}
    </AnimatedPressable>
  );
}
