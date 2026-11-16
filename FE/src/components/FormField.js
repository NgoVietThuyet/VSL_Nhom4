import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, ICON_SIZE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../constants/theme';

export default function FormField({ label, icon, optional, secure = false, error, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{optional ? <Text style={styles.optional}> (Không bắt buộc)</Text> : <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.error]}>
        <MaterialIcons name={icon} size={ICON_SIZE.sm} color={focused ? COLORS.primary : COLORS.onSurfaceVariant} />
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={COLORS.outline}
          secureTextEntry={secure && !visible}
          onFocus={(event) => { setFocused(true); inputProps.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); inputProps.onBlur?.(event); }}
          accessibilityLabel={label}
        />
        {secure && (
          <Pressable
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
          >
            <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={ICON_SIZE.sm} color={COLORS.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: SPACING.lg },
  label: { ...TYPOGRAPHY.label, color: COLORS.onSurface, marginBottom: SPACING.sm },
  optional: { ...TYPOGRAPHY.caption, color: COLORS.onSurfaceVariant },
  required: { color: COLORS.error },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  focused: { borderColor: COLORS.primary, borderWidth: 2, paddingLeft: SPACING.md - 1 },
  error: { borderColor: COLORS.error },
  input: { ...TYPOGRAPHY.body, flex: 1, minWidth: 0, color: COLORS.onSurface, paddingVertical: SPACING.md },
  visibilityButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  errorText: { ...TYPOGRAPHY.caption, color: COLORS.error, marginTop: SPACING.xs },
});
