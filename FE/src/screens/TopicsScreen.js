import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { TOPICS as FALLBACK_TOPICS } from '../data/mockData';
import { apiGetTopics } from '../api/apiClient';
import CircularProgress from '../components/CircularProgress';

export default function TopicsScreen({ navigation }) {
  const [topics, setTopics] = useState(FALLBACK_TOPICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, basic, single, phrases

  const fetchTopics = async () => {
    try {
      const data = await apiGetTopics();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((t, idx) => ({
          id: t.topicId,
          topicId: t.topicId,
          number: t.displayOrder || idx + 1,
          title: t.name,
          emoji: t.emoji || '📚',
          level: t.level || 'Cơ bản',
          signsCount: t.signCount || 40,
          progress: idx === 0 ? 85 : (idx === 1 ? 40 : (idx === 2 ? 100 : 0)),
          status: idx === 2 ? 'completed' : (idx < 2 ? 'learning' : 'locked'),
          category: t.category || 'single',
          description: t.description,
        }));
        setTopics(mapped);
      }
    } catch (err) {
      console.warn('Lỗi kết nối Topics API:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const filteredTopics = topics.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'basic') return t.level === 'Cơ bản' || t.level === 'Nhập môn';
    if (activeFilter === 'single') return t.category.includes('single');
    if (activeFilter === 'phrases') return t.category.includes('phrases');
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh Mục Chủ Đề</Text>
        <TouchableOpacity style={styles.filterIconButton}>
          <MaterialIcons name="tune" size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTopics();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color={COLORS.outline} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chủ đề, ký hiệu VSL..."
            placeholderTextColor={COLORS.outlineVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'all' && styles.activeChip]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.chipText, activeFilter === 'all' && styles.activeChipText]}>
              Tất cả (10)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'basic' && styles.activeChip]}
            onPress={() => setActiveFilter('basic')}
          >
            <Text style={[styles.chipText, activeFilter === 'basic' && styles.activeChipText]}>
              Cơ bản
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'single' && styles.activeChip]}
            onPress={() => setActiveFilter('single')}
          >
            <MaterialIcons
              name="sign-language"
              size={15}
              color={activeFilter === 'single' ? COLORS.onPrimary : COLORS.onSurfaceVariant}
            />
            <Text style={[styles.chipText, activeFilter === 'single' && styles.activeChipText]}>
              Ký hiệu đơn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'phrases' && styles.activeChip]}
            onPress={() => setActiveFilter('phrases')}
          >
            <MaterialIcons
              name="forum"
              size={15}
              color={activeFilter === 'phrases' ? COLORS.onPrimary : COLORS.onSurfaceVariant}
            />
            <Text style={[styles.chipText, activeFilter === 'phrases' && styles.activeChipText]}>
              Câu giao tiếp
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Quick Progress Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <CircularProgress
              size={54}
              strokeWidth={5}
              progress={30}
              label="30%"
              color={COLORS.tertiary}
            />
            <View>
              <Text style={styles.summaryTitle}>Chủ đề giao tiếp</Text>
              <Text style={styles.summarySub}>Đã hoàn thành 3 / 10 chủ đề</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.signsCountBadge}>
              <Text style={styles.signsCountText}>120 ký hiệu</Text>
            </View>
            <Text style={styles.signsLearnedLabel}>đã thành thạo</Text>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Danh sách Chủ đề</Text>
          <Text style={styles.topicCountLabel}>{filteredTopics.length} chủ đề thường ngày</Text>
        </View>

        {/* Topics 2-Column Grid */}
        <View style={styles.topicsGrid}>
          {filteredTopics.map((topic) => {
            const isLocked = topic.status === 'locked';

            return (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, isLocked && styles.topicCardLocked]}
                onPress={() => {
                  if (!isLocked) {
                    navigation.navigate('TopicDetail', { topic });
                  }
                }}
                activeOpacity={isLocked ? 1 : 0.85}
              >
                <View style={styles.topicCardTop}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  {isLocked ? (
                    <View style={styles.lockedBadge}>
                      <MaterialIcons name="lock" size={12} color={COLORS.outline} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.levelTag,
                        topic.status === 'completed' && { backgroundColor: COLORS.tertiaryFixed },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelTagText,
                          topic.status === 'completed' && { color: COLORS.onTertiaryFixed },
                        ]}
                      >
                        {topic.level}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.topicInfoCol}>
                  <Text style={styles.topicName} numberOfLines={2}>
                    {topic.number}. {topic.title}
                  </Text>
                  <Text style={styles.topicSignsCount}>{topic.signsCount} Ký hiệu</Text>
                </View>

                <View style={styles.topicCardBottom}>
                  <View style={styles.topicProgressLabelRow}>
                    <Text
                      style={[
                        styles.topicProgressPercent,
                        topic.status === 'completed' && { color: COLORS.tertiary },
                        isLocked && { color: COLORS.outline },
                      ]}
                    >
                      {topic.progress}%
                    </Text>
                    <Text style={styles.topicStatusText}>
                      {topic.status === 'completed'
                        ? 'Hoàn thành'
                        : isLocked
                        ? 'Chưa mở'
                        : 'Đang học'}
                    </Text>
                  </View>

                  <View style={styles.miniBarTrack}>
                    <View
                      style={[
                        styles.miniBarFill,
                        {
                          width: `${topic.progress}%`,
                          backgroundColor:
                            topic.status === 'completed' ? COLORS.tertiary : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  chipsRow: {
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  activeChipText: {
    color: COLORS.onPrimary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  summarySub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  signsCountBadge: {
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  signsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  signsLearnedLabel: {
    fontSize: 10,
    color: COLORS.outline,
    marginTop: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  topicCountLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 160,
    ...SHADOWS.sm,
  },
  topicCardLocked: {
    opacity: 0.6,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  topicCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicEmoji: {
    fontSize: 26,
  },
  levelTag: {
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onPrimaryFixedVariant,
  },
  lockedBadge: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfoCol: {
    marginVertical: 10,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 18,
  },
  topicSignsCount: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 3,
  },
  topicCardBottom: {
    gap: 6,
  },
  topicProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicProgressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  topicStatusText: {
    fontSize: 10,
    color: COLORS.outline,
  },
  miniBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
