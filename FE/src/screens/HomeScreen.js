import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { apiGetDashboard } from '../api/apiClient';
import { mapSign } from '../api/mappers';
import CircularProgress from '../components/CircularProgress';

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Map dữ liệu từ Backend API thực tế
  const user = dashboardData?.user || {};
  const courseOverview = dashboardData?.courseOverview || {};

  const currentTopic = dashboardData?.currentTopic ? {
    id: dashboardData.currentTopic.topicId,
    topicId: dashboardData.currentTopic.topicId,
    number: dashboardData.currentTopic.displayOrder,
    title: dashboardData.currentTopic.name,
    emoji: dashboardData.currentTopic.emoji || '📚',
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
        <Text style={styles.signWord}>{item.word}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerState]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerState]} edges={['top', 'left', 'right']}>
        <MaterialIcons name="cloud-off" size={48} color={COLORS.outline} />
        <Text style={styles.emptyText}>Không tải được dữ liệu từ máy chủ.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchDashboard();
          }}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
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
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName}>{user.fullName || ''} 👋</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topBadgesRow}>
            {/* Streak Badge */}
            <View style={styles.streakBadge}>
              <MaterialIcons name="local-fire-department" size={18} color={COLORS.secondary} />
              <Text style={styles.streakText}>{user.streakDays ?? 0} ngày</Text>
            </View>

            {/* Notification button */}
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Banner */}
        <View style={styles.motiveBanner}>
          <View style={styles.motiveIconBox}>
            <MaterialIcons name="auto-awesome" size={24} color={COLORS.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.motiveTitle}>VSL - Cầu Nối Yêu Thương</Text>
            <Text style={styles.motiveSub}>
              Mỗi cử chỉ trao đi là một nhịp cầu gắn kết cộng đồng người khiếm thính.
            </Text>
          </View>
        </View>

        {/* Quick Action Shortcuts (Grid 2-column) */}
        <View style={styles.quickActionsGrid}>
          {/* Practice AI Camera */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('AICamera', { sign: displaySigns[0] || {} })}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialIcons name="photo-camera-front" size={24} color={COLORS.onPrimary} />
            </View>
            <View>
              <Text style={styles.actionCardTitle}>Luyện AI Camera</Text>
              <Text style={styles.actionCardSub}>Mở camera thực hành</Text>
            </View>
          </TouchableOpacity>

          {/* Daily Quiz */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.surfaceContainerLowest }]}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: COLORS.secondaryFixed }]}>
              <MaterialIcons name="psychology-alt" size={24} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={[styles.actionCardTitle, { color: COLORS.onSurface }]}>Quiz ngày</Text>
              <Text style={[styles.actionCardSub, { color: COLORS.onSurfaceVariant }]}>Ôn luyện 5 phút</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Master Course Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.roadmapTag}>LỘ TRÌNH TỔNG QUAN</Text>
              <Text style={styles.courseTitle}>{courseOverview.courseTitle || ''}</Text>
            </View>
            {!!courseOverview.levelTitle && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{courseOverview.levelTitle}</Text>
              </View>
            )}
          </View>

          {/* Radial & Linear Progress */}
          <View style={styles.progressVisualRow}>
            <CircularProgress
              size={80}
              strokeWidth={7}
              progress={courseOverview.overallProgress ?? 0}
              label={`${courseOverview.overallProgress ?? 0}%`}
            />

            <View style={styles.linearStatsCol}>
              {/* Stat 1: Ký hiệu từ vựng */}
              <View style={styles.statLine}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>Ký hiệu từ vựng</Text>
                  <Text style={styles.statValue}>
                    {courseOverview.masteredSigns ?? 0} / {courseOverview.totalSigns ?? 0}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round(((courseOverview.masteredSigns || 0) / (courseOverview.totalSigns || 1)) * 100)}%`,
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Stat 2: Câu giao tiếp */}
              <View style={styles.statLine}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>Câu giao tiếp</Text>
                  <Text style={styles.statValue}>
                    {courseOverview.masteredPhrases ?? 0} / {courseOverview.totalPhrases ?? 0}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round(((courseOverview.masteredPhrases || 0) / (courseOverview.totalPhrases || 1)) * 100)}%`,
                        backgroundColor: COLORS.secondaryContainer,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 3-Column Micro Stats */}
          <View style={styles.microStatsRow}>
            <View style={styles.microStatBox}>
              <MaterialIcons name="lock-open" size={20} color={COLORS.primary} />
              <Text style={styles.microStatNum}>{courseOverview.openTopicsCount ?? 0}</Text>
              <Text style={styles.microStatLabel}>Chủ đề mở</Text>
            </View>
            <View style={styles.microStatBox}>
              <MaterialIcons name="center-focus-strong" size={20} color={COLORS.tertiary} />
              <Text style={styles.microStatNum}>
                {courseOverview.aiAccuracy != null ? `${courseOverview.aiAccuracy}%` : '--'}
              </Text>
              <Text style={styles.microStatLabel}>AI Chuẩn</Text>
            </View>
            <View style={styles.microStatBox}>
              <MaterialIcons name="military-tech" size={20} color={COLORS.secondaryContainer} />
              <Text style={styles.microStatNum}>{(user.xp ?? 0).toLocaleString()}</Text>
              <Text style={styles.microStatLabel}>Điểm XP</Text>
            </View>
          </View>
        </View>

        {/* Continue Learning Active Topic Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bài học hiện tại</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Topics')}>
            <Text style={styles.sectionLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {currentTopic ? (
          <TouchableOpacity
            style={styles.activeTopicCard}
            onPress={() => navigation.navigate('TopicDetail', { topic: currentTopic })}
            activeOpacity={0.88}
          >
            <View style={styles.activeTopicTop}>
              <View style={styles.topicIconLarge}>
                <Text style={{ fontSize: 28 }}>{currentTopic.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.activeTopicBadgeRow}>
                  <Text style={styles.activeTopicBadge}>
                    ĐANG HỌC{currentTopic.level ? ` • ${currentTopic.level}` : ''}
                  </Text>
                  <Text style={styles.activeTopicPercent}>{currentTopic.progress}%</Text>
                </View>
                <Text style={styles.activeTopicTitle}>{currentTopic.title}</Text>
                <Text style={styles.activeTopicCount}>
                  Đã thuộc {currentTopic.completedSigns} / {currentTopic.signsCount} ký hiệu
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.topicBarTrack}>
              <View style={[styles.topicBarFill, { width: `${currentTopic.progress}%` }]} />
            </View>

            <View style={styles.activeTopicFooter}>
              <Text style={styles.topicCtaText}>Tiếp tục bài học</Text>
              <MaterialIcons name="arrow-forward" size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyInlineText}>Chưa có chủ đề nào.</Text>
        )}

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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.margin,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyInlineText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  retryButtonText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
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
    paddingBottom: 32,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondaryContainer,
  },
  motiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  motiveIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  motiveSub: {
    fontSize: 12,
    color: COLORS.onPrimaryContainer,
    marginTop: 2,
    lineHeight: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  actionCardSub: {
    fontSize: 11,
    color: COLORS.onPrimaryContainer,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  roadmapTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onPrimaryFixedVariant,
  },
  progressVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  linearStatsCol: {
    flex: 1,
    gap: SPACING.sm,
  },
  statLine: {
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  microStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  microStatBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microStatNum: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  microStatLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  activeTopicCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
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
  activeTopicBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTopicBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 0.5,
  },
  activeTopicPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
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
  topicBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  topicBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  activeTopicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceContainerHigh,
  },
  topicCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  signsCarousel: {
    paddingRight: SPACING.margin,
    gap: SPACING.md,
  },
  signCard: {
    width: 140,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
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
  signScoreRow: {
    marginTop: 6,
  },
  masteredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryFixed,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  masteredTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onTertiaryFixed,
  },
});
