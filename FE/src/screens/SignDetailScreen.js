import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import { apiGetSignDetail } from '../api/apiClient';
import { mapSign } from '../api/mappers';

export default function SignDetailScreen({ route, navigation }) {
  const [sign, setSign] = useState(route.params?.sign || null);

  const [isBookmarked, setIsBookmarked] = useState(false);

  // Luôn tải chi tiết đầy đủ từ Backend (dữ liệu truyền qua route có thể thiếu các bước, ghi chú...)
  useEffect(() => {
    const signId = route.params?.sign?.signId;
    if (!signId) return;
    apiGetSignDetail(signId)
      .then((data) => {
        if (data) setSign(mapSign(data));
      })
      .catch((err) => console.warn('Lỗi tải chi tiết ký hiệu:', err.message));
  }, [route.params?.sign?.signId]);

  if (!sign) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Ký hiệu" showBack={true} onBack={() => navigation.goBack()} />
        <Text style={styles.emptyText}>Không tìm thấy ký hiệu.</Text>
      </SafeAreaView>
    );
  }

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
        {/* Video ký hiệu (upload từ trang Admin) */}
        <VideoPlayer uri={sign.videoUrl} poster={sign.videoThumb} />

        {/* Word Info Banner */}
        <View style={styles.wordInfoCard}>
          <View style={styles.tagRow}>
            {!!sign.topicName && (
              <View style={styles.tagPrimary}>
                <MaterialIcons name="folder-open" size={14} color={COLORS.onPrimary} />
                <Text style={styles.tagPrimaryText}>Chủ đề: {sign.topicName}</Text>
              </View>
            )}
            {!!sign.type && (
              <View style={styles.tagSecondary}>
                <Text style={styles.tagSecondaryText}>
                  {sign.type === 'phrases' ? 'Câu giao tiếp' : 'Ký hiệu đơn lẻ'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.titleAudioRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.signWordLarge}>{(sign.word || '').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Step-by-step breakdown */}
        {sign.steps?.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="directions-walk" size={22} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Hướng dẫn từng bước</Text>
              </View>
              <Text style={styles.stepCountText}>{sign.steps.length} bước cốt lõi</Text>
            </View>

            <View style={styles.stepsCol}>
              {sign.steps.map((stepItem, idx) => (
                <View key={stepItem.step ?? idx} style={styles.stepItemRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{stepItem.step ?? idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{stepItem.title}</Text>
                    <Text style={styles.stepDetail}>{stepItem.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cultural & Linguistic Note */}
        {!!sign.culturalNote && (
          <View style={styles.culturalCard}>
            <View style={styles.culturalTitleRow}>
              <MaterialIcons name="lightbulb" size={20} color={COLORS.secondary} />
              <Text style={styles.culturalTitle}>Mẹo văn hóa & Ngữ pháp VSL</Text>
            </View>
            <Text style={styles.culturalText}>{sign.culturalNote}</Text>
          </View>
        )}
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
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
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
