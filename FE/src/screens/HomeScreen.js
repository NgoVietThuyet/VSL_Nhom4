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
  const user = dashboardData?.user || {
    fullName: 'Nguyễn Minh Anh',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    streakDays: 5,
    xp: 1450,
  };

  const courseOverview = dashboardData?.courseOverview || {
    overallProgress: 30,
    masteredSigns: 120,
    totalSigns: 400,
    masteredPhrases: 35,
    totalPhrases: 100,
    openTopicsCount: 8,
    aiAccuracy: 94.2,
  };

  const currentTopic = dashboardData?.currentTopic ? {
    id: dashboardData.currentTopic.topicId,
    title: dashboardData.currentTopic.name,
    emoji: dashboardData.currentTopic.emoji || '👋',
    level: dashboardData.currentTopic.level || 'Cơ bản',
    progress: dashboardData.currentTopicProgress || 85,
    signsCount: dashboardData.currentTopic.signCount || 40,
    completedSigns: dashboardData.currentTopicCompletedSigns || 34,
  } : {
    title: 'Chào hỏi & Xã giao',
    emoji: '👋',
    level: 'Cơ bản',
    progress: 85,
    signsCount: 40,
    completedSigns: 34,
  };

  const displaySigns = (dashboardData?.recommendedSigns && dashboardData.recommendedSigns.length > 0)
    ? dashboardData.recommendedSigns.map(s => ({
        id: s.signId,
        word: s.nameVi,
        ipa: s.ipa || '',
        duration: s.duration || '0:03',
        videoThumb: s.videoThumb || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        videoUrl: s.videoUrl,
        status: s.difficulty === 1 ? 'mastered' : 'review',
        aiScore: 95,
      }))
    : [];

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
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName}>{user.fullName} 👋</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topBadgesRow}>
            {/* Streak Badge */}
            <View style={styles.streakBadge}>
              <MaterialIcons name="local-fire-department" size={18} color={COLORS.secondary} />
              <Text style={styles.streakText}>{user.streakDays} ngày</Text>
            </View>

            {/* Notification button */}
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={22} color={COLORS.onSurface} />
              <View style={styles.notificationDot} />
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
              <Text style={styles.courseTitle}>{courseOverview.courseTitle || 'Khóa học VSL Cơ Bản'}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{courseOverview.levelTitle || 'Sơ cấp A1'}</Text>
            </View>
          </View>

          {/* Radial & Linear Progress */}
          <View style={styles.progressVisualRow}>
            <CircularProgress
              size={80}
              strokeWidth={7}
              progress={courseOverview.overallProgress}
              label={`${courseOverview.overallProgress}%`}
            />

            <View style={styles.linearStatsCol}>
              {/* Stat 1: Ký hiệu từ vựng */}
              <View style={styles.statLine}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>Ký hiệu từ vựng</Text>
                  <Text style={styles.statValue}>
                    {courseOverview.masteredSigns} / {courseOverview.totalSigns}
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
                    {courseOverview.masteredPhrases} / {courseOverview.totalPhrases}
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
              <Text style={styles.microStatNum}>{courseOverview.openTopicsCount}</Text>
              <Text style={styles.microStatLabel}>Chủ đề mở</Text>
            </View>
            <View style={styles.microStatBox}>
              <MaterialIcons name="center-focus-strong" size={20} color={COLORS.tertiary} />
              <Text style={styles.microStatNum}>{courseOverview.aiAccuracy}%</Text>
              <Text style={styles.microStatLabel}>AI Chuẩn</Text>
            </View>
            <View style={styles.microStatBox}>
              <MaterialIcons name="military-tech" size={20} color={COLORS.secondaryContainer} />
              <Text style={styles.microStatNum}>{user.xp ? user.xp.toLocaleString() : '1,450'}</Text>
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
                <Text style={styles.activeTopicBadge}>ĐANG HỌC • {currentTopic.level}</Text>
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

        {/* Recommended Daily Signs Carousel/List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ký hiệu tiêu biểu hôm nay</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TopicDetail', { topic: currentTopic })}>
            <Text style={styles.sectionLink}>Khám phá</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.signsCarousel}
        >
          {displaySigns.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.signCard}
              onPress={() => navigation.navigate('SignDetail', { sign: item })}
              activeOpacity={0.85}
            >
              <View style={styles.signImageWrap}>
                <Image source={{ uri: item.videoThumb }} style={styles.signImage} />
                <View style={styles.durationBadge}>
                  <MaterialIcons name="play-arrow" size={12} color="#fff" />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>
              <View style={styles.signCardContent}>
                <Text style={styles.signWord}>{item.word}</Text>
                <Text style={styles.signIpa}>{item.ipa}</Text>
                <View style={styles.signScoreRow}>
                  {item.status === 'mastered' ? (
                    <View style={styles.masteredTag}>
                      <MaterialIcons name="check-circle" size={12} color={COLORS.tertiary} />
                      <Text style={styles.masteredTagText}>AI {item.aiScore}%</Text>
                    </View>
                  ) : item.status === 'review' ? (
                    <View style={[styles.masteredTag, { backgroundColor: COLORS.secondaryFixed }]}>
                      <MaterialIcons name="refresh" size={12} color={COLORS.secondary} />
                      <Text style={[styles.masteredTagText, { color: COLORS.secondary }]}>Cần ôn</Text>
                    </View>
                  ) : (
                    <View style={[styles.masteredTag, { backgroundColor: COLORS.surfaceContainerHigh }]}>
                      <Text style={[styles.masteredTagText, { color: COLORS.onSurfaceVariant }]}>Mới</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
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
  signIpa: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
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
