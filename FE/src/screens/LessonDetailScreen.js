import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, CONTENT_MAX_WIDTH } from '../constants/theme';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';
import ScreenState from '../components/ScreenState';
import { apiGetLessonDetail } from '../api/apiClient';
import { mapLesson } from '../api/mappers';

const STATUS_INFO = {
  mastered: { label: 'Đã thuộc', icon: 'check-circle', color: COLORS.tertiary },
  review: { label: 'Cần ôn', icon: 'history', color: COLORS.secondary },
  unlearned: { label: 'Chưa học', icon: 'radio-button-unchecked', color: COLORS.outline },
};

export default function LessonDetailScreen({ route, navigation }) {
  const lessonId = route.params?.lesson?.lessonId;
  const [lesson, setLesson] = useState(route.params?.lesson || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLesson = async () => {
    if (!lessonId) return;
    try {
      const data = await apiGetLessonDetail(lessonId);
      if (data) {
        setLesson(mapLesson(data));
        setError(null);
      }
    } catch (err) {
      console.warn('Lỗi tải chi tiết bài học:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tải lại mỗi khi quay về màn hình -> thấy ngay nội dung Admin vừa cập nhật
  useFocusEffect(
    useCallback(() => {
      fetchLesson();
    }, [lessonId])
  );

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Header title="Bài học" showBack={true} onBack={() => navigation.goBack()} />
        <ScreenState title="Không tìm thấy bài học" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const signs = lesson.signs || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Header title="Bài học" showBack={true} onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLesson();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Thông tin bài học */}
        <View style={styles.infoCard}>
          {!!lesson.topicName && <Text style={styles.topicLabel}>{lesson.topicName}</Text>}
          <Text style={styles.lessonTitle}>{lesson.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialIcons name="sign-language" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>{signs.length || lesson.signsCount} ký hiệu</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialIcons name="signal-cellular-alt" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>Độ khó {lesson.difficulty}</Text>
            </View>
          </View>

          {!!lesson.description && <Text style={styles.description}>{lesson.description}</Text>}
        </View>

        {/* Mục tiêu bài học */}
        {!!lesson.objectives && (
          <View style={styles.objectivesCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="flag" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Mục tiêu bài học</Text>
            </View>
            <Text style={styles.objectivesText}>{lesson.objectives}</Text>
          </View>
        )}

        {/* Danh sách ký hiệu trong bài */}
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="list" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Ký hiệu trong bài</Text>
        </View>

        {loading && signs.length === 0 && <ScreenState kind="loading" title="Đang tải bài học" />}
        {!loading && !!error && signs.length === 0 &&
          <ScreenState kind="error" title="Không tải được bài học" message={error}
            actionLabel="Thử lại" onAction={fetchLesson} />}
        {!loading && !error && signs.length === 0 &&
          <ScreenState title="Bài học chưa có ký hiệu nào" />}

        <View style={styles.signFeed}>
          {signs.map((item, idx) => {
            const status = STATUS_INFO[item.status] || STATUS_INFO.unlearned;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.signCard}
                onPress={() => navigation.navigate('SignDetail', { sign: item })}
                activeOpacity={0.85}
              >
                <View style={styles.thumbBox}>
                  {item.videoThumb ? (
                    <Image source={{ uri: item.videoThumb }} style={styles.thumbImage} />
                  ) : (
                    <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                      <MaterialIcons name="sign-language" size={22} color={COLORS.outline} />
                    </View>
                  )}
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{idx + 1}</Text>
                  </View>
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.signWord}>{item.word}</Text>
                  {!!item.description && (
                    <Text style={styles.signDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.statusRow}>
                    <MaterialIcons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {signs.length > 0 && (
        <View style={styles.bottomBar}>
          <ActionButton label="Bắt đầu học" icon="play-circle" onPress={() => {
              const next = signs.find((s) => s.status !== 'mastered') || signs[0];
              navigation.navigate('SignDetail', { sign: next });
            }} />
        </View>
      )}
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
  infoCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  topicLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  lessonTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  description: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  objectivesCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  objectivesText: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurface,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  signFeed: {
    gap: SPACING.sm,
  },
  signCard: {
    ...SURFACES.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  thumbBox: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  orderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  signWord: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  signDesc: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
});
