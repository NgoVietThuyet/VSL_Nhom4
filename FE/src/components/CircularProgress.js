import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, TYPE } from '../constants/theme';

export default function CircularProgress({ size = 72, strokeWidth = 6, progress = 0, color = COLORS.primary, trailColor = COLORS.surfaceContainerHigh, label }) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} accessibilityLabel={`Tiến độ ${value}%`}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessible={false}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trailColor} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} strokeLinecap="round" fill="none" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={styles.label}>{label ?? `${Math.round(value)}%`}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', color: COLORS.onSurface, fontSize: TYPE.body, fontWeight: '700' },
});
