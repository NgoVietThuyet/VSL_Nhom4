import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { apiGetTopics } from '../api/apiClient';

// Giá trị khớp với cột TOPICS.level trong CSDL ('' = tất cả)
const LEVEL_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'Nhập môn', label: 'Nhập môn' },
  { value: 'Cơ bản', label: 'Cơ bản' },
  { value: 'Trung cấp', label: 'Trung cấp' },
  { value: 'Nâng cao', label: 'Nâng cao' },
];

const SEARCH_DEBOUNCE_MS = 300;

export default function TopicsScreen({ navigation }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('');

  const fetchTopics = async () => {
    try {
      const data = await apiGetTopics(activeLevel, debouncedSearch);
      if (Array.isArray(data)) {
        const mapped = data.map((t, idx) => ({
          id: t.topicId,
          topicId: t.topicId,
          number: t.displayOrder || idx + 1,
          title: t.name || '',
          emoji: t.emoji || '📚',
          level: t.level || '',
          signsCount: t.signCount ?? 0,
          completedSigns: t.masteredCount,
          progress: t.progress,
          category: t.category || '',
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

  // Chỉ gọi API khi người dùng ngừng gõ một khoảng ngắn
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tải lại khi đổi bộ lọc và mỗi khi quay về màn hình (thấy ngay chủ đề Admin vừa thêm)
  useFocusEffect(
    useCallback(() => {
      fetchTopics();
    }, [activeLevel, debouncedSearch])
  );

  const isFiltering = !!activeLevel || !!debouncedSearch;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh Mục Chủ Đề</Text>
        <TouchableOpacity style={styles.filterIconButton} accessibilityLabel="Bộ lọc chủ đề" accessibilityRole="button">
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
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12} accessibilityLabel="Xóa tìm kiếm" accessibilityRole="button">
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
          {LEVEL_FILTERS.map((filter) => {
            const isActive = activeLevel === filter.value;
            return (
              <TouchableOpacity
                key={filter.label}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveLevel(filter.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.topicCountLabel}>{topics.length} chủ đề</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        ) : topics.length === 0 ? (
          <Text style={styles.emptyText}>
            {isFiltering ? 'Không tìm thấy chủ đề phù hợp.' : 'Chưa có chủ đề nào.'}
          </Text>
        ) : (
          <View style={styles.topicsGrid}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                onPress={() => navigation.navigate('TopicDetail', { topic })}
                activeOpacity={0.85}
              >
                <View style={styles.topicCardTop}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  {!!topic.level && (
                    <View style={styles.levelTag}>
                      <Text style={styles.levelTagText}>{topic.level}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.topicInfoCol}>
                  <Text style={styles.topicName} numberOfLines={2}>
                    {topic.number}. {topic.title}
                  </Text>
                  <Text style={styles.topicSignsCount}>{topic.signsCount} Ký hiệu</Text>
                </View>

                {/* Tiến độ cá nhân (Backend chỉ trả về khi đã đăng nhập) */}
                {topic.progress != null && (
                  <View style={styles.topicCardBottom}>
                    <View style={styles.topicProgressLabelRow}>
                      <Text
                        style={[
                          styles.topicProgressPercent,
                          topic.progress === 100 && { color: COLORS.tertiary },
                        ]}
                      >
                        {topic.progress}%
                      </Text>
                      <Text style={styles.topicStatusText}>
                        {topic.progress === 100 ? 'Hoàn thành' : topic.progress > 0 ? 'Đang học' : 'Chưa học'}
                      </Text>
                    </View>
                    <View style={styles.miniBarTrack}>
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${topic.progress}%`,
                            backgroundColor: topic.progress === 100 ? COLORS.tertiary : COLORS.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 30,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 56,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    minHeight: 44,
    paddingVertical: 10,
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
  topicCountLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
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
    padding: SPACING.lg,
    justifyContent: 'space-between',
    minHeight: 176,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  topicSignsCount: {
    fontSize: 12,
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
