import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, ICON_SIZE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../constants/theme';

export default function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = loading || disabled;
  const secondary = variant === 'secondary';
  const foreground = isDisabled ? COLORS.onSurfaceVariant : secondary ? COLORS.primary : COLORS.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        style,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <MaterialIcons name={icon} size={ICON_SIZE.sm} color={foreground} />}
          <Text style={[styles.label, secondary && styles.secondaryLabel, isDisabled && styles.disabledLabel]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH_TARGET,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  secondary: {
    backgroundColor: COLORS.primaryContainer,
  },
  label: {
    ...TYPOGRAPHY.button,
    color: COLORS.onPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryLabel: { color: COLORS.primary },
  disabled: { backgroundColor: COLORS.disabledContainer },
  disabledLabel: { color: COLORS.onSurfaceVariant },
  pressed: { opacity: 0.8 },
});
