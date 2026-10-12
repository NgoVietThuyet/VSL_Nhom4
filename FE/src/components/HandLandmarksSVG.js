import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Path, Polygon } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export default function HandLandmarksSVG({ width = 320, height = 400 }) {
  // Coordinated to fit nicely on mobile screens
  const scaleX = width / 360;
  const scaleY = height / 480;

  const sx = (val) => val * scaleX;
  const sy = (val) => val * scaleY;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Palm Cross Connections */}
        <Line x1={sx(155)} y1={sy(330)} x2={sx(168)} y2={sy(290)} stroke="#9CF2E8" strokeWidth={1.5} strokeOpacity={0.8} />
        <Line x1={sx(168)} y1={sy(290)} x2={sx(190)} y2={sy(280)} stroke="#9CF2E8" strokeWidth={1.5} strokeOpacity={0.8} />
        <Line x1={sx(190)} y1={sy(280)} x2={sx(212)} y2={sy(288)} stroke="#9CF2E8" strokeWidth={1.5} strokeOpacity={0.8} />
        <Line x1={sx(212)} y1={sy(288)} x2={sx(232)} y2={sy(305)} stroke="#9CF2E8" strokeWidth={1.5} strokeOpacity={0.8} />

        {/* Wrist to Thumb (Tangerine) */}
        <Line x1={sx(180)} y1={sy(360)} x2={sx(155)} y2={sy(330)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(155)} y1={sy(330)} x2={sx(135)} y2={sy(295)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(135)} y1={sy(295)} x2={sx(120)} y2={sy(265)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(120)} y1={sy(265)} x2={sx(110)} y2={sy(235)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />

        {/* Wrist to Index Finger (Teal) */}
        <Line x1={sx(180)} y1={sy(360)} x2={sx(168)} y2={sy(290)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(168)} y1={sy(290)} x2={sx(162)} y2={sy(235)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(162)} y1={sy(235)} x2={sx(158)} y2={sy(190)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(158)} y1={sy(190)} x2={sx(155)} y2={sy(150)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />

        {/* Wrist to Middle Finger (Teal) */}
        <Line x1={sx(180)} y1={sy(360)} x2={sx(190)} y2={sy(280)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(190)} y1={sy(280)} x2={sx(192)} y2={sy(225)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(192)} y1={sy(225)} x2={sx(193)} y2={sy(175)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(193)} y1={sy(175)} x2={sx(194)} y2={sy(135)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />

        {/* Wrist to Ring Finger (Teal) */}
        <Line x1={sx(180)} y1={sy(360)} x2={sx(212)} y2={sy(288)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(212)} y1={sy(288)} x2={sx(220)} y2={sy(238)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(220)} y1={sy(238)} x2={sx(225)} y2={sy(195)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(225)} y1={sy(195)} x2={sx(228)} y2={sy(158)} stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />

        {/* Wrist to Pinky Finger (Tangerine) */}
        <Line x1={sx(180)} y1={sy(360)} x2={sx(232)} y2={sy(305)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(232)} y1={sy(305)} x2={sx(245)} y2={sy(265)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(245)} y1={sy(265)} x2={sx(252)} y2={sy(230)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={sx(252)} y1={sy(230)} x2={sx(256)} y2={sy(200)} stroke="#FD761A" strokeWidth={2.5} strokeLinecap="round" />

        {/* Wrist (Node 0) */}
        <Circle cx={sx(180)} cy={sy(360)} r={10} fill="none" stroke="#4EDEA3" strokeOpacity={0.6} strokeWidth={1.5} />
        <Circle cx={sx(180)} cy={sy(360)} r={6} fill="#007952" stroke="#FFFFFF" strokeWidth={2} />

        {/* Thumb (Nodes 1-4) */}
        <Circle cx={sx(155)} cy={sy(330)} r={4} fill="#FD761A" />
        <Circle cx={sx(135)} cy={sy(295)} r={4} fill="#FD761A" />
        <Circle cx={sx(120)} cy={sy(265)} r={4.5} fill="#FD761A" />
        <Circle cx={sx(110)} cy={sy(235)} r={5.5} fill="#FFB690" stroke="#FD761A" strokeWidth={2} />

        {/* Index (Nodes 5-8) */}
        <Circle cx={sx(168)} cy={sy(290)} r={4} fill="#0F766E" />
        <Circle cx={sx(162)} cy={sy(235)} r={4} fill="#0F766E" />
        <Circle cx={sx(158)} cy={sy(190)} r={4.5} fill="#0F766E" />
        <Circle cx={sx(155)} cy={sy(150)} r={5.5} fill="#9CF2E8" stroke="#0F766E" strokeWidth={2} />

        {/* Middle (Nodes 9-12) */}
        <Circle cx={sx(190)} cy={sy(280)} r={4} fill="#0F766E" />
        <Circle cx={sx(192)} cy={sy(225)} r={4} fill="#0F766E" />
        <Circle cx={sx(193)} cy={sy(175)} r={4.5} fill="#0F766E" />
        <Circle cx={sx(194)} cy={sy(135)} r={5.5} fill="#9CF2E8" stroke="#0F766E" strokeWidth={2} />

        {/* Ring (Nodes 13-16) */}
        <Circle cx={sx(212)} cy={sy(288)} r={4} fill="#0F766E" />
        <Circle cx={sx(220)} cy={sy(238)} r={4} fill="#0F766E" />
        <Circle cx={sx(225)} cy={sy(195)} r={4.5} fill="#0F766E" />
        <Circle cx={sx(228)} cy={sy(158)} r={5.5} fill="#9CF2E8" stroke="#0F766E" strokeWidth={2} />

        {/* Pinky (Nodes 17-20) */}
        <Circle cx={sx(232)} cy={sy(305)} r={4} fill="#FD761A" />
        <Circle cx={sx(245)} cy={sy(265)} r={4} fill="#FD761A" />
        <Circle cx={sx(252)} cy={sy(230)} r={4.5} fill="#FD761A" />
        <Circle cx={sx(256)} cy={sy(200)} r={5.5} fill="#FFB690" stroke="#FD761A" strokeWidth={2} />

        {/* Motion Arc Trajectory */}
        <Path
          d={`M ${sx(120)} ${sy(180)} Q ${sx(155)} ${sy(110)} ${sx(210)} ${sy(125)}`}
          fill="none"
          stroke="#4EDEA3"
          strokeDasharray="4 4"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
