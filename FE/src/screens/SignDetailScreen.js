import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { VOCABULARY_LIST } from '../data/mockData';
import Header from '../components/Header';

export default function SignDetailScreen({ route, navigation }) {
  const sign = route.params?.sign || VOCABULARY_LIST[0];

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [speed, setSpeed] = useState('1.0x');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleSpeed = () => {
    if (speed === '1.0x') setSpeed('0.75x');
    else if (speed === '0.75x') setSpeed('0.5x');
    else setSpeed('1.0x');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title={sign.word}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <MaterialIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isBookmarked ? COLORS.primary : COLORS.onSurface}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Video Player Mockup Container */}
        <View style={styles.videoPlayerContainer}>
          <Image source={{ uri: sign.videoThumb }} style={styles.videoCover} />

          {/* Top Video Controls Overlay */}
          <View style={styles.videoTopOverlay}>
            <TouchableOpacity style={styles.speedBadge} onPress={toggleSpeed}>
              <Text style={styles.speedText}>Tốc độ {speed}</Text>
            </TouchableOpacity>

            <View style={styles.badgeHD}>
              <Text style={styles.badgeHDText}>HD 1080p</Text>
            </View>
          </View>

          {/* Center Play/Pause Overlay */}
          <TouchableOpacity
            style={styles.centerPlayBtn}
            onPress={() => setIsPlaying(!isPlaying)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Bottom Timeline Controls */}
          <View style={styles.videoBottomOverlay}>
            <View style={styles.timelineTrack}>
              <View style={[styles.timelineFill, { width: '50%' }]} />
            </View>
            <View style={styles.timelineTimeRow}>
              <Text style={styles.timeText}>00:02 / {sign.duration}</Text>
              <TouchableOpacity
                style={styles.loopToggle}
                onPress={() => setIsLooping(!isLooping)}
              >
                <MaterialIcons
                  name="repeat"
                  size={14}
                  color={isLooping ? COLORS.primaryFixed : '#fff'}
                />
                <Text
                  style={[
                    styles.loopText,
                    isLooping && { color: COLORS.primaryFixed },
                  ]}
                >
                  Lặp lại: {isLooping ? 'Bật' : 'Tắt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Word Info Banner */}
        <View style={styles.wordInfoCard}>
          <View style={styles.tagRow}>
            <View style={styles.tagPrimary}>
              <MaterialIcons name="folder-open" size={14} color={COLORS.onPrimary} />
              <Text style={styles.tagPrimaryText}>Chủ đề: Chào hỏi & Xã giao</Text>
            </View>
            <View style={styles.tagSecondary}>
              <Text style={styles.tagSecondaryText}>Ký hiệu đơn lẻ</Text>
            </View>
          </View>

          <View style={styles.titleAudioRow}>
            <View>
              <Text style={styles.signWordLarge}>{sign.word.toUpperCase()}</Text>
              <Text style={styles.signPhonetic}>
                Phiên âm: <Text style={styles.boldPhonetic}>{sign.ipa}</Text> • Tiếng Anh: <Text style={{ fontStyle: 'italic' }}>{sign.english}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.audioLargeBtn}
              onPress={() => Alert.alert('Phát âm', `${sign.word}: ${sign.ipa}`)}
            >
              <MaterialIcons name="volume-up" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step-by-step breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="directions-walk" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Hướng dẫn từng bước</Text>
            </View>
            <Text style={styles.stepCountText}>{sign.steps?.length || 2} bước cốt lõi</Text>
          </View>

          <View style={styles.stepsCol}>
            {sign.steps?.map((stepItem) => (
              <View key={stepItem.step} style={styles.stepItemRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{stepItem.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{stepItem.title}</Text>
                  <Text style={styles.stepDetail}>{stepItem.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cultural & Linguistic Note */}
        <View style={styles.culturalCard}>
          <View style={styles.culturalTitleRow}>
            <MaterialIcons name="lightbulb" size={20} color={COLORS.secondary} />
            <Text style={styles.culturalTitle}>Mẹo văn hóa & Ngữ pháp VSL</Text>
          </View>
          <Text style={styles.culturalText}>{sign.culturalNote}</Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.practiceAIButton}
          onPress={() => navigation.navigate('AICamera', { sign })}
          activeOpacity={0.85}
        >
          <MaterialIcons name="photo-camera-front" size={22} color={COLORS.onPrimary} />
          <Text style={styles.practiceAIText}>Luyện tập ngay với AI Camera</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.sm,
    paddingBottom: 90,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.inverseSurface,
    position: 'relative',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  videoCover: {
    width: '100%',
    height: '100%',
  },
  videoTopOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  speedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  badgeHD: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeHDText: {
    fontSize: 10,
    color: COLORS.primaryFixed,
    fontWeight: '700',
  },
  centerPlayBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBottomOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    gap: 4,
  },
  timelineTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primaryFixed,
  },
  timelineTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  loopToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  loopText: {
    fontSize: 10,
    color: '#fff',
  },
  wordInfoCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  tagSecondary: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagSecondaryText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  titleAudioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  signWordLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  signPhonetic: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 3,
  },
  boldPhonetic: {
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  audioLargeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepsCol: {
    gap: SPACING.md,
  },
  stepItemRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  stepDetail: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
  },
  culturalCard: {
    backgroundColor: COLORS.secondaryFixed,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: 6,
  },
  culturalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  culturalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  culturalText: {
    fontSize: 12,
    color: COLORS.onSecondaryFixed,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceContainerHigh,
    ...SHADOWS.lg,
  },
  practiceAIButton: {
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  practiceAIText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
});
