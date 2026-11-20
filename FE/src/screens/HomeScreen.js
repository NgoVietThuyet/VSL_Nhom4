import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, CONTENT_MAX_WIDTH } from '../constants/theme';
import { apiGetDashboard } from '../api/apiClient';
import { mapSign } from '../api/mappers';
import ScreenState from '../components/ScreenState';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({ navigation }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await apiGetDashboard();
      if (data) {
        setDashboardData(data);
      }
    } catch (error) {
      console.warn('Lỗi kết nối Backend:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tải lại mỗi khi quay về Trang chủ để cập nhật dữ liệu mới từ Admin
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  // Map dữ liệu từ Backend API thực tế
  const user = dashboardData?.user || {};
  const courseOverview = dashboardData?.courseOverview || {};

  const currentTopic = dashboardData?.currentTopic ? {
    id: dashboardData.currentTopic.topicId,
    topicId: dashboardData.currentTopic.topicId,
    number: dashboardData.currentTopic.displayOrder,
    title: dashboardData.currentTopic.name,
    emoji: dashboardData.currentTopic.emoji || '',
    level: dashboardData.currentTopic.level || '',
    description: dashboardData.currentTopic.description,
    progress: dashboardData.currentTopicProgress ?? 0,
    signsCount: dashboardData.currentTopic.signCount ?? 0,
    completedSigns: dashboardData.currentTopicCompletedSigns ?? 0,
  } : null;

  const displaySigns = (dashboardData?.recommendedSigns || []).map(mapSign);
  const reviewSigns = (dashboardData?.reviewSigns || []).map(mapSign);

  const renderSignCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.signCard}
      onPress={() => navigation.navigate('SignDetail', { sign: item })}
      activeOpacity={0.85}
    >
      <View style={styles.signImageWrap}>
        {item.videoThumb ? (
          <Image source={{ uri: item.videoThumb }} style={styles.signImage} />
        ) : (
          <View style={[styles.signImage, styles.imagePlaceholder]}>
            <MaterialIcons name="sign-language" size={32} color={COLORS.outline} />
          </View>
        )}
        {!!item.duration && (
          <View style={styles.durationBadge}>
            <MaterialIcons name="play-arrow" size={12} color="#fff" />
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.signCardContent}>
        <Text style={styles.signWord} numberOfLines={2}>{item.word}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenState kind="loading" title="Đang tải trang chủ" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenState kind="error" title="Không tải được trang chủ"
          message="Vui lòng kiểm tra kết nối rồi thử lại."
          actionLabel="Thử lại" onAction={() => {
            setLoading(true);
            fetchDashboard();
          }} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Top User Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={24} color={COLORS.primary} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName} numberOfLines={2}>{user.fullName || ''}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <MaterialIcons name="local-fire-department" size={18} color={COLORS.secondary} />
            <Text style={styles.streakText}>{user.streakDays ?? 0} ngày</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tiếp tục học</Text>
        </View>

        {currentTopic ? (
          <TouchableOpacity
            style={styles.activeTopicCard}
            onPress={() => navigation.navigate('TopicDetail', { topic: currentTopic })}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Tiếp tục chủ đề ${currentTopic.title}, đã thuộc ${currentTopic.completedSigns} trên ${currentTopic.signsCount} ký hiệu`}
          >
            <View style={styles.activeTopicTop}>
              <View style={styles.topicIconLarge}>
                <MaterialIcons name="sign-language" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.activeTopicTitle}>{currentTopic.title}</Text>
                <Text style={styles.activeTopicCount}>
                  Đã thuộc {currentTopic.completedSigns} / {currentTopic.signsCount} ký hiệu · {currentTopic.progress}%
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
            </View>
            <ProgressBar label="Tiến độ chủ đề" progress={currentTopic.progress} style={{ marginTop: SPACING.md }} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyInlineText}>Chưa có chủ đề nào.</Text>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AICamera', { sign: displaySigns[0] || {} })}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <MaterialIcons name="photo-camera-front" size={22} color={COLORS.primary} />
            <Text style={styles.actionRowText}>Luyện AI Camera</Text>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <MaterialIcons name="psychology-alt" size={22} color={COLORS.primary} />
            <Text style={styles.actionRowText}>Làm Quiz</Text>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
          </TouchableOpacity>
        </View>

        {/* Master Course Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.courseTitle}>{courseOverview.courseTitle || 'Tiến độ học tập'}</Text>
            <Text style={styles.progressPercent}>{courseOverview.overallProgress ?? 0}%</Text>
          </View>
          <ProgressBar label="Tiến độ học tập" progress={courseOverview.overallProgress ?? 0} />
          <View style={styles.progressMeta}>
            <Text style={styles.progressMetaText}>
              Ký hiệu {courseOverview.masteredSigns ?? 0}/{courseOverview.totalSigns ?? 0}
            </Text>
            <Text style={styles.progressMetaText}>
              Câu giao tiếp {courseOverview.masteredPhrases ?? 0}/{courseOverview.totalPhrases ?? 0}
            </Text>
          </View>
          {!!courseOverview.levelTitle && <Text style={styles.levelText}>{courseOverview.levelTitle}</Text>}
        </View>

        {/* Recommended Daily Signs Carousel/List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ký hiệu tiêu biểu hôm nay</Text>
          {currentTopic && (
            <TouchableOpacity onPress={() => navigation.navigate('TopicDetail', { topic: currentTopic })}>
              <Text style={styles.sectionLink}>Khám phá</Text>
            </TouchableOpacity>
          )}
        </View>

        {displaySigns.length === 0 ? (
          <Text style={styles.emptyInlineText}>Chưa có ký hiệu nào.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.signsCarousel}
          >
            {displaySigns.map(renderSignCard)}
          </ScrollView>
        )}

        {/* Signs To Review */}
        {reviewSigns.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Từ cần ôn tập</Text>
              <View style={styles.reviewCountBadge}>
                <Text style={styles.reviewCountText}>{reviewSigns.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.signsCarousel}
            >
              {reviewSigns.map(renderSignCard)}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  emptyInlineText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  reviewCountBadge: {
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  reviewCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryFixed,
  },
  greetingText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  userName: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  quickActions: { gap: SPACING.sm, marginBottom: SPACING.xxl },
  actionRow: {
    ...SURFACES.card,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  actionRowText: { ...TYPOGRAPHY.body, color: COLORS.onSurface, fontWeight: '600', flex: 1 },
  progressCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  courseTitle: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
    flex: 1,
  },
  progressPercent: { ...TYPOGRAPHY.section, color: COLORS.primary },
  progressMeta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.lg, rowGap: SPACING.xs, marginTop: SPACING.md },
  progressMetaText: { ...TYPOGRAPHY.caption, color: COLORS.onSurfaceVariant },
  levelText: { ...TYPOGRAPHY.caption, color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  activeTopicCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  activeTopicTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  topicIconLarge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTopicTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  activeTopicCount: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  signsCarousel: {
    paddingRight: SPACING.margin,
    gap: SPACING.md,
  },
  signCard: {
    ...SURFACES.card,
    width: 140,
    overflow: 'hidden',
  },
  signImageWrap: {
    width: '100%',
    height: 95,
    position: 'relative',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  signCardContent: {
    padding: 8,
  },
  signWord: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
});
