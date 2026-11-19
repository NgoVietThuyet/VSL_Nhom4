import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SIZES, SPACING, TYPE } from '../constants/theme';

export default function FormField({ label, value, onChangeText, error, secure = false, optional = false, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}{optional ? <Text style={styles.optional}> · Không bắt buộc</Text> : null}</Text>
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.invalid]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ invalid: !!error }}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={COLORS.outline}
          secureTextEntry={secure && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {secure && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setVisible(!visible)} style={styles.eye}>
          <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={SIZES.icon} color={COLORS.onSurfaceVariant} />
        </Pressable>}
      </View>
      {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { marginBottom: SPACING.lg },
  label: { color: COLORS.onSurface, fontSize: TYPE.bodySmall, fontWeight: '700', marginBottom: SPACING.sm },
  optional: { color: COLORS.onSurfaceVariant, fontWeight: '400' },
  inputRow: { minHeight: SIZES.input, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceContainerLowest, flexDirection: 'row', alignItems: 'center' },
  focused: { borderWidth: 2, borderColor: COLORS.primary },
  invalid: { borderColor: COLORS.error },
  input: { flex: 1, minHeight: SIZES.input, paddingHorizontal: SPACING.md, color: COLORS.onSurface, fontSize: TYPE.body },
  eye: { minWidth: SIZES.touch, minHeight: SIZES.touch, alignItems: 'center', justifyContent: 'center' },
  error: { color: COLORS.error, fontSize: TYPE.bodySmall, marginTop: SPACING.xs },
});
