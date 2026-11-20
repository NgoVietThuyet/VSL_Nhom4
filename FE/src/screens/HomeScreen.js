import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TOUCH, FONT } from '../constants/theme';
import { FEATURES, COMING_SOON_LABEL } from '../constants/features';
import { apiGetDashboard } from '../api/apiClient';
import { mapSign } from '../api/mappers';
import CircularProgress from '../components/CircularProgress';
import Touchable from '../components/Touchable';
import { PopIn } from '../components/Motion';

const percentOf = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);

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
    <Touchable
      key={item.id}
      style={styles.signCard}
      onPress={() => navigation.navigate('SignDetail', { sign: item })}
      accessibilityLabel={`Ký hiệu ${item.word}`}
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
            <MaterialIcons name="play-arrow" size={14} color="#fff" />
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.signCardContent}>
        <Text style={styles.signWord} numberOfLines={1}>{item.word}</Text>
      </View>
    </Touchable>
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
        <Touchable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchDashboard();
          }}
        >
          <MaterialIcons name="refresh" size={20} color={COLORS.onPrimary} />
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </Touchable>
      </SafeAreaView>
    );
  }

  const masteredSigns = courseOverview.masteredSigns ?? 0;
  const totalSigns = courseOverview.totalSigns ?? 0;
  const masteredPhrases = courseOverview.masteredPhrases ?? 0;
  const totalPhrases = courseOverview.totalPhrases ?? 0;

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
        {/* Thanh người dùng: avatar, chuỗi ngày học, XP */}
        <View style={styles.topBar}>
          <Touchable
            style={styles.profileRow}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Mở trang cá nhân"
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={24} color={COLORS.primary} />
              </View>
            )}
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName} numberOfLines={1}>{user.fullName || ''} 👋</Text>
            </View>
          </Touchable>

          <View style={styles.topBadgesRow}>
            <PopIn style={styles.streakBadge} popKey={user.streakDays}>
              <MaterialIcons name="local-fire-department" size={20} color={COLORS.secondary} />
              <Text style={styles.streakText}>{user.streakDays ?? 0} ngày</Text>
            </PopIn>
            <View style={styles.xpBadge}>
              <MaterialIcons name="military-tech" size={20} color={COLORS.primary} />
              <Text style={styles.xpText}>{(user.xp ?? 0).toLocaleString()} XP</Text>
            </View>
          </View>
        </View>

        {/* Hành động chính: Học tiếp */}
        <Touchable
          style={styles.heroCard}
          onPress={() =>
            currentTopic
              ? navigation.navigate('TopicDetail', { topic: currentTopic })
              : navigation.navigate('Topics')
          }
          haptic="light"
          accessibilityLabel={currentTopic ? `Học tiếp: ${currentTopic.title}` : 'Chọn chủ đề để bắt đầu học'}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroEmojiBox}>
              <Text style={styles.heroEmoji}>{currentTopic ? currentTopic.emoji : '🚀'}</Text>
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroLabel}>
                {currentTopic
                  ? `ĐANG HỌC${currentTopic.level ? ` • ${currentTopic.level}` : ''}`
                  : 'BẮT ĐẦU'}
              </Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {currentTopic ? `Học tiếp: ${currentTopic.title}` : 'Chọn chủ đề đầu tiên'}
              </Text>
            </View>
            <View style={styles.heroArrow}>
              <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
            </View>
          </View>

          {!!currentTopic && (
            <View style={styles.heroProgress}>
              <View style={styles.heroBarTrack}>
                <View style={[styles.heroBarFill, { width: `${currentTopic.progress}%` }]} />
              </View>
              <Text style={styles.heroProgressText}>
                Đã thuộc {currentTopic.completedSigns} / {currentTopic.signsCount} ký hiệu · {currentTopic.progress}%
              </Text>
            </View>
          )}
        </Touchable>

        {/* Hành động phụ */}
        <View style={styles.quickActionsRow}>
          <Touchable
            style={[styles.quickBtn, styles.quickBtnOutline]}
            onPress={() => navigation.navigate('Quiz')}
            accessibilityLabel="Làm quiz ngày"
          >
            <View style={[styles.quickIconBox, { backgroundColor: COLORS.secondaryFixed }]}>
              <MaterialIcons name="psychology-alt" size={24} color={COLORS.secondary} />
            </View>
            <View style={styles.quickTextCol}>
              <Text style={styles.quickTitle}>Quiz ngày</Text>
              <Text style={styles.quickSub}>Ôn luyện 5 phút</Text>
            </View>
          </Touchable>

          <Touchable
            style={[styles.quickBtn, styles.quickBtnOutline, !FEATURES.aiCamera && styles.quickBtnSoon]}
            onPress={() => navigation.navigate('AICamera', { sign: displaySigns[0] || {} })}
            disabled={!FEATURES.aiCamera}
            accessibilityLabel={FEATURES.aiCamera ? 'Luyện AI Camera' : `Luyện AI Camera, ${COMING_SOON_LABEL}`}
          >
            <View style={[styles.quickIconBox, { backgroundColor: COLORS.primaryFixed }]}>
              <MaterialIcons name="photo-camera-front" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.quickTextCol}>
              <Text style={styles.quickTitle}>Luyện AI</Text>
              <Text style={styles.quickSub}>
                {FEATURES.aiCamera ? 'Mở camera thực hành' : COMING_SOON_LABEL}
              </Text>
            </View>
          </Touchable>
        </View>

        {/* Tiến độ tổng quan (gọn) */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressHeaderText}>
              <Text style={styles.roadmapTag}>LỘ TRÌNH TỔNG QUAN</Text>
              <Text style={styles.courseTitle} numberOfLines={1}>{courseOverview.courseTitle || ''}</Text>
            </View>
            {!!courseOverview.levelTitle && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{courseOverview.levelTitle}</Text>
              </View>
            )}
          </View>

          <View style={styles.progressVisualRow}>
            <CircularProgress
              size={80}
              strokeWidth={7}
              progress={courseOverview.overallProgress ?? 0}
              label={`${courseOverview.overallProgress ?? 0}%`}
            />

            <View style={styles.linearStatsCol}>
              <View style={styles.statLine}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>Ký hiệu từ vựng</Text>
                  <Text style={styles.statValue}>{masteredSigns} / {totalSigns}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${percentOf(masteredSigns, totalSigns)}%`, backgroundColor: COLORS.primary },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statLine}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>Câu giao tiếp</Text>
                  <Text style={styles.statValue}>{masteredPhrases} / {totalPhrases}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${percentOf(masteredPhrases, totalPhrases)}%`, backgroundColor: COLORS.secondaryContainer },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Từ cần ôn tập */}
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
              style={styles.carouselSpacing}
            >
              {reviewSigns.map(renderSignCard)}
            </ScrollView>
          </>
        )}

        {/* Ký hiệu tiêu biểu */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ký hiệu tiêu biểu hôm nay</Text>
          <Touchable
            style={styles.sectionLinkBtn}
            onPress={() =>
              currentTopic
                ? navigation.navigate('TopicDetail', { topic: currentTopic })
                : navigation.navigate('Topics')
            }
          >
            <Text style={styles.sectionLink}>{currentTopic ? 'Khám phá' : 'Xem chủ đề'}</Text>
          </Touchable>
        </View>

        {displaySigns.length === 0 ? (
          <Text style={styles.emptyInlineText}>Chưa có ký hiệu nào.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.signsCarousel}
            style={styles.carouselSpacing}
          >
            {displaySigns.map(renderSignCard)}
          </ScrollView>
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
    fontSize: FONT.body,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyInlineText: {
    fontSize: FONT.body,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.sm,
    minHeight: TOUCH.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  retryButtonText: {
    fontSize: FONT.body,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 32,
  },

  // Thanh người dùng
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  profileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH.min,
    borderRadius: RADIUS.lg,
  },
  avatar: {
    width: TOUCH.min,
    height: TOUCH.min,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryFixed,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: FONT.label,
    color: COLORS.onSurfaceVariant,
  },
  userName: {
    fontSize: FONT.bodyLg,
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
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  streakText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  xpText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.onPrimaryFixedVariant,
  },

  // Nút chính "Học tiếp"
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroEmojiBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 30,
  },
  heroTextCol: {
    flex: 1,
  },
  heroLabel: {
    fontSize: FONT.label,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.onPrimaryContainer,
  },
  heroTitle: {
    fontSize: FONT.title + 2,
    fontWeight: '800',
    color: COLORS.onPrimary,
    marginTop: 2,
  },
  heroArrow: {
    width: TOUCH.min,
    height: TOUCH.min,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProgress: {
    marginTop: SPACING.md,
    gap: 6,
  },
  heroBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  heroBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.secondaryFixed,
  },
  heroProgressText: {
    fontSize: FONT.body,
    color: COLORS.onPrimaryContainer,
    fontWeight: '600',
  },

  // Hành động phụ (nút có viền rõ)
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickBtn: {
    flex: 1,
    minHeight: 72,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quickBtnOutline: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  quickBtnSoon: {
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    backgroundColor: COLORS.disabledSurface,
    elevation: 0,
    shadowOpacity: 0,
  },
  quickIconBox: {
    width: TOUCH.min,
    height: TOUCH.min,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextCol: {
    flex: 1,
  },
  quickTitle: {
    fontSize: FONT.body + 1,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  quickSub: {
    fontSize: FONT.label,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },

  // Tiến độ
  progressCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  progressHeaderText: {
    flex: 1,
  },
  roadmapTag: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: FONT.title,
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
    fontSize: FONT.label,
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
    fontSize: FONT.body,
    color: COLORS.onSurfaceVariant,
  },
  statValue: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Mục + carousel
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    minHeight: TOUCH.min,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FONT.title,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  sectionLinkBtn: {
    minHeight: TOUCH.min,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  sectionLink: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewCountBadge: {
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  reviewCountText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  carouselSpacing: {
    marginBottom: SPACING.lg,
    overflow: 'visible',
  },
  signsCarousel: {
    paddingRight: SPACING.margin,
    paddingVertical: SPACING.xs,
    gap: SPACING.md,
  },
  signCard: {
    width: 150,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  signImageWrap: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: FONT.label,
    color: '#fff',
    fontWeight: '600',
  },
  signCardContent: {
    padding: SPACING.sm + 2,
  },
  signWord: {
    fontSize: FONT.body + 1,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
});
