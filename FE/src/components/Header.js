import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <MaterialIcons name="sign-language" size={20} color={COLORS.onPrimary} />
          </View>
        )}
      </View>

      <View style={styles.centerCol}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightRow}>
        {rightComponent ? rightComponent : <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: COLORS.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainerHighest,
  },
  leftRow: {
    width: 48,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  rightRow: {
    width: 48,
    alignItems: 'flex-end',
  },
});
