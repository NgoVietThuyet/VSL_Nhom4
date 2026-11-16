import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';

const SPEEDS = [1.0, 0.75, 0.5];

/**
 * Trình phát video bài học / ký hiệu (video upload từ trang Admin lên MinIO).
 * Không có videoUrl -> hiển thị ảnh bìa hoặc biểu tượng thay thế.
 */
export default function VideoPlayer({ uri, poster, height = 220 }) {
  const [speedIdx, setSpeedIdx] = useState(0);
  const [isLooping, setIsLooping] = useState(true);

  const player = useVideoPlayer(uri || null, (p) => {
    p.loop = true;
  });

  const toggleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    player.playbackRate = SPEEDS[next];
  };

  const toggleLoop = () => {
    player.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  if (!uri) {
    return (
      <View style={[styles.container, { height }]}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.fill} />
        ) : (
          <View style={[styles.fill, styles.placeholder]}>
            <MaterialIcons name="sign-language" size={56} color={COLORS.outline} />
          </View>
        )}
        <View style={styles.noVideoBadge}>
          <MaterialIcons name="videocam-off" size={18} color={COLORS.inverseOnSurface} />
          <Text style={styles.noVideoText}>Chưa có video</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { height }]}>
        <VideoView
          player={player}
          style={styles.fill}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
        />
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlChip} onPress={toggleSpeed} activeOpacity={0.8}
          accessibilityRole="button" accessibilityLabel={`Tốc độ phát ${SPEEDS[speedIdx]} lần, nhấn để đổi`}>
          <MaterialIcons name="speed" size={18} color={COLORS.primary} />
          <Text style={styles.controlText}>Tốc độ {SPEEDS[speedIdx]}x</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlChip, isLooping && styles.controlChipActive]}
          onPress={toggleLoop}
          activeOpacity={0.8}
          accessibilityRole="button" accessibilityLabel={`Lặp lại ${isLooping ? 'bật' : 'tắt'}`}
          accessibilityState={{ selected: isLooping }}
        >
          <MaterialIcons name="repeat" size={18} color={isLooping ? COLORS.onPrimary : COLORS.primary} />
          <Text style={[styles.controlText, isLooping && { color: COLORS.onPrimary }]}>
            Lặp lại: {isLooping ? 'Bật' : 'Tắt'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  container: {
    width: '100%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.inverseSurface,
    marginBottom: SPACING.sm,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.inverseSurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  noVideoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inverseOnSurface,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: TOUCH_TARGET,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  controlChipActive: {
    backgroundColor: COLORS.primary,
  },
  controlText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
