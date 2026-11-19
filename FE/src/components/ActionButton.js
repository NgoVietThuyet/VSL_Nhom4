import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SIZES, SPACING, TYPE } from '../constants/theme';

export default function ActionButton({ label, onPress, variant = 'primary', disabled = false, loading = false, icon, style }) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.base, variant === 'secondary' && styles.secondary, inactive && styles.disabled, pressed && !inactive && styles.pressed, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? COLORS.primary : COLORS.onPrimary} /> : <>
        {icon}
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
      </>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: { minHeight: SIZES.button, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  secondary: { backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.border },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  label: { color: COLORS.onPrimary, fontSize: TYPE.body, fontWeight: '700', textAlign: 'center' },
  secondaryLabel: { color: COLORS.primary },
});
