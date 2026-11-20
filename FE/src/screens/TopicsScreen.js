import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, TOUCH_TARGET, CONTENT_MAX_WIDTH } from '../constants/theme';
import { apiGetTopics } from '../api/apiClient';
import ScreenState from '../components/ScreenState';
import ProgressBar from '../components/ProgressBar';

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
  const { width } = useWindowDimensions();
  const cardWidth = width >= 700 ? '48.5%' : '100%';
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('');
  const [error, setError] = useState(null);

  const fetchTopics = async () => {
    try {
      const data = await apiGetTopics(activeLevel, debouncedSearch);
      setError(null);
      if (Array.isArray(data)) {
        const mapped = data.map((t, idx) => ({
          id: t.topicId,
          topicId: t.topicId,
          number: t.displayOrder || idx + 1,
          title: t.name || '',
          emoji: t.emoji || '',
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
      setError(err.message || 'Không thể tải danh sách chủ đề.');
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
        <Text style={styles.headerTitle}>Chủ đề</Text>
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
            accessibilityLabel="Tìm kiếm chủ đề"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}
              accessibilityRole="button" accessibilityLabel="Xóa từ khóa tìm kiếm">
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

        {!loading && topics.length > 0 && <Text style={styles.topicCountLabel}>{topics.length} chủ đề</Text>}

        {loading && !refreshing ? (
          <ScreenState kind="loading" title="Đang tải chủ đề" />
        ) : error && topics.length === 0 ? (
          <ScreenState kind="error" title="Không tải được chủ đề" message={error}
            actionLabel="Thử lại" onAction={fetchTopics} />
        ) : topics.length === 0 ? (
          <ScreenState title={isFiltering ? 'Không tìm thấy chủ đề phù hợp' : 'Chưa có chủ đề nào'}
            message={isFiltering ? 'Thử từ khóa hoặc mức độ khác.' : 'Danh sách chủ đề sẽ xuất hiện tại đây.'} />
        ) : (
          <View style={styles.topicsGrid}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicRow, { width: cardWidth }]}
                onPress={() => navigation.navigate('TopicDetail', { topic })}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${topic.title}, ${topic.signsCount} ký hiệu${topic.progress != null ? `, tiến độ ${topic.progress}%` : ''}`}
              >
                <View style={styles.topicIcon}>
                  <MaterialIcons name="sign-language" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.topicInfoCol}>
                  <Text style={styles.topicName} numberOfLines={2}>
                    {topic.number}. {topic.title}
                  </Text>
                  <Text style={styles.topicSignsCount}>
                    {topic.signsCount} ký hiệu{topic.level ? ` · ${topic.level}` : ''}
                  </Text>
                  {topic.progress != null && (
                    <View style={styles.topicProgressRow}>
                      <ProgressBar label={`Tiến độ ${topic.title}`} progress={topic.progress}
                        color={topic.progress === 100 ? COLORS.tertiary : COLORS.primary}
                        style={{ flex: 1 }} />
                      <Text style={styles.topicProgressPercent}>{topic.progress}%</Text>
                    </View>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
              </TouchableOpacity>
            ))}
          </View>
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.onSurface,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.onSurface,
  },
  clearSearch: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
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
  topicCountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  topicRow: {
    ...SURFACES.card,
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  topicName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  topicSignsCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSurfaceVariant,
    marginTop: 3,
  },
  topicProgressPercent: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  topicProgressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
});
