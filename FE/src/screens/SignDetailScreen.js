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
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, TOUCH_TARGET, CONTENT_MAX_WIDTH } from '../constants/theme';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import ActionButton from '../components/ActionButton';
import ScreenState from '../components/ScreenState';
import { apiGetSignDetail } from '../api/apiClient';
import { mapSign } from '../api/mappers';

export default function SignDetailScreen({ route, navigation }) {
  const [sign, setSign] = useState(route.params?.sign || null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Luôn tải chi tiết đầy đủ từ Backend (dữ liệu truyền qua route có thể thiếu các bước, ghi chú...)
  useEffect(() => {
    const signId = route.params?.sign?.signId;
    if (!signId) return;
    apiGetSignDetail(signId)
      .then((data) => {
        if (data) setSign(mapSign(data));
        setLoadError(null);
      })
      .catch((err) => {
        console.warn('Lỗi tải chi tiết ký hiệu:', err.message);
        setLoadError(err.message || 'Không thể cập nhật chi tiết ký hiệu.');
      });
  }, [route.params?.sign?.signId]);

  if (!sign) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Header title="Ký hiệu" showBack={true} onBack={() => navigation.goBack()} />
        <ScreenState title="Không tìm thấy ký hiệu" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="Ký hiệu"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsBookmarked(!isBookmarked)}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Bỏ lưu ký hiệu' : 'Lưu ký hiệu'}
            accessibilityState={{ selected: isBookmarked }}
          >
            <MaterialIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isBookmarked ? COLORS.primary : COLORS.onSurface}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!!loadError && <Text style={styles.loadError} accessibilityLiveRegion="polite">{loadError}</Text>}
        {/* Video ký hiệu (upload từ trang Admin) */}
        <VideoPlayer uri={sign.videoUrl} poster={sign.videoThumb} />

        {/* Word Info Banner */}
        <View style={styles.wordInfoCard}>
          <View style={styles.tagRow}>
            {!!sign.topicName && (
              <Text style={styles.tagText}>Chủ đề: {sign.topicName}</Text>
            )}
            {!!sign.type && (
              <Text style={styles.tagText}>
                {sign.type === 'phrases' ? 'Câu giao tiếp' : 'Ký hiệu đơn lẻ'}
              </Text>
            )}
          </View>

          <View style={styles.titleAudioRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.signWordLarge}>{sign.word || ''}</Text>
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
        <ActionButton label="Luyện tập ngay với AI Camera" icon="photo-camera-front"
          onPress={() => navigation.navigate('AICamera', { sign })}
          style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} />
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
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  loadError: { ...TYPOGRAPHY.caption, color: COLORS.error, marginBottom: SPACING.sm },
  headerIconBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordInfoCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagText: { ...TYPOGRAPHY.caption, color: COLORS.onSurfaceVariant },
  titleAudioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  signWordLarge: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  sectionCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.sm,
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
    paddingVertical: SPACING.sm,
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
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
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
    ...TYPOGRAPHY.body,
    color: COLORS.onSecondaryFixed,
  },
  bottomBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
});
