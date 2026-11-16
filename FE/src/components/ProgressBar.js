import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export default function ProgressBar({ progress = 0, color = COLORS.primary, label, style }) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Tiến độ'}
      accessibilityValue={{ min: 0, max: 100, now: value }}
    >
      <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADIUS.full },
});
