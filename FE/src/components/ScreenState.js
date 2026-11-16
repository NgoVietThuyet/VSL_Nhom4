import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ActionButton from './ActionButton';
import { COLORS, ICON_SIZE, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function ScreenState({ kind = 'empty', title, message, actionLabel, onAction, style }) {
  const loading = kind === 'loading';
  const icon = kind === 'error' ? 'cloud-off' : 'inbox';

  return (
    <View style={[styles.container, style]} accessibilityLiveRegion="polite">
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} accessibilityLabel={title || 'Đang tải'} />
      ) : (
        <MaterialIcons name={icon} size={ICON_SIZE.lg} color={COLORS.onSurfaceVariant} />
      )}
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <ActionButton label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  title: { ...TYPOGRAPHY.section, color: COLORS.onSurface, textAlign: 'center' },
  message: { ...TYPOGRAPHY.body, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  action: { marginTop: SPACING.sm, alignSelf: 'center' },
});
