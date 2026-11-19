import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SIZES, TYPE } from '../constants/theme';

export default function Header({ title, showBack = false, onBack, rightComponent, subtitle }) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} style={({ pressed }) => [styles.leading, pressed && styles.pressed]}>
          <MaterialIcons name="arrow-back" size={SIZES.icon} color={COLORS.onSurface} />
        </Pressable>
      ) : <View style={styles.leading} accessible={false}><MaterialIcons name="sign-language" size={SIZES.icon} color={COLORS.primary} /></View>}
      <View style={styles.centerCol}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.trailing}>{rightComponent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 64, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.margin, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  leading: { width: SIZES.touch, minHeight: SIZES.touch, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: COLORS.surfaceContainerHigh },
  centerCol: { flex: 1, paddingHorizontal: SPACING.sm },
  title: { fontSize: TYPE.titleSmall, lineHeight: 25, fontWeight: '700', color: COLORS.onSurface },
  subtitle: { fontSize: TYPE.caption, color: COLORS.onSurfaceVariant, marginTop: 2 },
  trailing: { minWidth: SIZES.touch, alignItems: 'flex-end', justifyContent: 'center' },
});
