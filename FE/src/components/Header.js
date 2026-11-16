import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';

export default function Header({
  title,
  showBack = false,
  onBack,
  rightComponent,
  subtitle,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack ? (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
        ) : (
          <View style={styles.logoBadge}>
            <MaterialIcons name="sign-language" size={20} color={COLORS.onPrimary} />
          </View>
        )}
      </View>

      <View style={styles.centerCol}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightRow}>
        {rightComponent || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    paddingVertical: SPACING.xs,
  },
  leftRow: {
    width: TOUCH_TARGET,
    alignItems: 'flex-start',
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  logoBadge: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  rightRow: {
    width: TOUCH_TARGET,
    alignItems: 'flex-end',
  },
  pressed: { opacity: 0.65 },
});
