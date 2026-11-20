import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, TOUCH_TARGET, CONTENT_MAX_WIDTH } from '../constants/theme';
import { apiGetTopicSigns, apiGetTopicLessons } from '../api/apiClient';
import { mapSign, mapLesson } from '../api/mappers';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';
import ScreenState from '../components/ScreenState';
import ProgressBar from '../components/ProgressBar';

export default function TopicDetailScreen({ route, navigation }) {
  const topic = route.params?.topic;

  const [vocabList, setVocabList] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, single, phrases
  const [error, setError] = useState(null);

  const topicId = topic?.topicId || topic?.id;

  const fetchSigns = async () => {
    try {
      if (!topicId) return;
      const [signData, lessonData] = await Promise.all([
        apiGetTopicSigns(topicId),
        apiGetTopicLessons(topicId).catch((err) => {
          console.warn('Lỗi kết nối Lessons API:', err.message);
          return null;
        }),
      ]);
      setError(null);
      if (Array.isArray(signData)) {
        setVocabList(signData.map(mapSign));
      }
      if (Array.isArray(lessonData)) {
        setLessons(lessonData.map(mapLesson));
      }
    } catch (err) {
      console.warn('Lỗi kết nối Signs API:', err.message);
      setError(err.message || 'Không thể tải ký hiệu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tải lại mỗi khi quay về màn hình -> thấy ngay bài học / video Admin vừa thêm
  useFocusEffect(
    useCallback(() => {
      fetchSigns();
    }, [topicId])
  );

  if (!topic) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Header title="Chủ đề" showBack={true} onBack={() => navigation.goBack()} />
        <ScreenState title="Không tìm thấy chủ đề" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const singleCount = vocabList.filter((v) => v.type === 'single').length;
  const phrasesCount = vocabList.filter((v) => v.type === 'phrases').length;
  const hasProgress = topic.progress != null;

  const filteredVocab = vocabList.filter((v) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'single') return v.type === 'single';
    if (activeTab === 'phrases') return v.type === 'phrases';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="Chủ đề"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.infoIconBtn} onPress={() => Alert.alert('Thông tin chủ đề', topic.description || 'Chưa có mô tả.')}
            accessibilityRole="button" accessibilityLabel="Thông tin chủ đề">
            <MaterialIcons name="info-outline" size={22} color={COLORS.onSurface} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSigns();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Topic Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.topicMetaRow}>
            <View style={styles.topicEmojiWrap}>
              <MaterialIcons name="sign-language" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {!!topic.level && <Text style={styles.headerCardCategory}>{topic.level}</Text>}
              <Text style={styles.headerCardTitle}>{topic.title}</Text>
            </View>
          </View>

          {/* Progress Tracker (chỉ hiển thị khi Backend trả về tiến độ) */}
          {hasProgress && (
            <View style={styles.progressBox}>
              <View style={styles.progressTopRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabelText}>
                    Đã thuộc {topic.completedSigns ?? 0}/{topic.signsCount ?? vocabList.length} ký hiệu
                  </Text>
                </View>
                <Text style={styles.progressPercentText}>{topic.progress}%</Text>
              </View>

              {/* Linear Progress Bar */}
              <ProgressBar label="Tiến độ chủ đề" progress={topic.progress} />

            </View>
          )}

          {/* Quick Action Dual Buttons */}
          {vocabList.length > 0 && (
            <View style={styles.actionButtonsRow}>
              <ActionButton label="Tiếp tục học ngay" icon="play-circle" style={styles.mainAction}
                onPress={() => navigation.navigate('SignDetail', { sign: vocabList[0] })} />
              <ActionButton label="Luyện AI" icon="videocam" variant="secondary" style={styles.sideAction}
                onPress={() => navigation.navigate('AICamera', { sign: vocabList[0] })} />
            </View>
          )}
        </View>

        {/* Danh sách bài học (do Admin tạo) */}
        {lessons.length > 0 && (
          <View style={styles.lessonSection}>
            <Text style={styles.sectionHeading}>Bài học ({lessons.length})</Text>
            <View style={styles.vocabFeed}>
              {lessons.map((lesson, idx) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.vocabItemCard}
                  onPress={() => navigation.navigate('LessonDetail', { lesson })}
                  activeOpacity={0.85}
                >
                  <View style={styles.thumbBox}>
                    {lesson.videoThumb ? (
                      <Image source={{ uri: lesson.videoThumb }} style={styles.thumbImage} />
                    ) : (
                      <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                        <MaterialIcons
                          name={lesson.videoUrl ? 'play-circle-outline' : 'menu-book'}
                          size={28}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                    {!!lesson.duration && (
                      <View style={styles.thumbDuration}>
                        <MaterialIcons name="play-arrow" size={10} color="#fff" />
                        <Text style={styles.thumbDurationText}>{lesson.duration}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.vocabInfoCol}>
                    <Text style={styles.lessonIndex}>Bài {idx + 1}</Text>
                    <Text style={styles.vocabWord} numberOfLines={2}>{lesson.title}</Text>
                    <Text style={styles.vocabDesc} numberOfLines={1}>
                      {lesson.signsCount} ký hiệu
                      {lesson.estimatedMinutes ? ` · ${lesson.estimatedMinutes} phút` : ''}
                    </Text>
                    {lesson.progress != null && (
                      <View style={styles.lessonBarTrack}>
                        <View style={[styles.barFill, { width: `${lesson.progress}%` }]} />
                      </View>
                    )}
                  </View>

                  <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionHeading}>Ký hiệu</Text>

        {/* Filter Tabs Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroller}
        >
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'all' && styles.activeTabChip]}
            onPress={() => setActiveTab('all')}
            accessibilityRole="button" accessibilityState={{ selected: activeTab === 'all' }}
          >
            <Text style={[styles.tabChipText, activeTab === 'all' && styles.activeTabChipText]}>
              Tất cả ({vocabList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'single' && styles.activeTabChip]}
            onPress={() => setActiveTab('single')}
            accessibilityRole="button" accessibilityState={{ selected: activeTab === 'single' }}
          >
            <Text style={[styles.tabChipText, activeTab === 'single' && styles.activeTabChipText]}>
              Ký hiệu đơn ({singleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'phrases' && styles.activeTabChip]}
            onPress={() => setActiveTab('phrases')}
            accessibilityRole="button" accessibilityState={{ selected: activeTab === 'phrases' }}
          >
            <Text style={[styles.tabChipText, activeTab === 'phrases' && styles.activeTabChipText]}>
              Câu giao tiếp ({phrasesCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Vocabulary Sign Feed List */}
        {loading && vocabList.length === 0 && <ScreenState kind="loading" title="Đang tải ký hiệu" />}
        {!loading && error && vocabList.length === 0 &&
          <ScreenState kind="error" title="Không tải được ký hiệu" message={error}
            actionLabel="Thử lại" onAction={fetchSigns} />}
        {!loading && !error && filteredVocab.length === 0 &&
          <ScreenState title="Chưa có ký hiệu nào" message="Thử chọn nhóm ký hiệu khác." />}
        <View style={styles.vocabFeed}>
          {filteredVocab.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.vocabItemCard}
              onPress={() => navigation.navigate('SignDetail', { sign: item })}
              activeOpacity={0.85}
            >
              {/* Thumbnail with video icon */}
              <View style={styles.thumbBox}>
                {item.videoThumb ? (
                  <Image source={{ uri: item.videoThumb }} style={styles.thumbImage} />
                ) : (
                  <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                    <MaterialIcons name="sign-language" size={24} color={COLORS.outline} />
                  </View>
                )}
                {!!item.duration && (
                  <View style={styles.thumbDuration}>
                    <MaterialIcons name="play-arrow" size={10} color="#fff" />
                    <Text style={styles.thumbDurationText}>{item.duration}</Text>
                  </View>
                )}
              </View>

              {/* Sign Details */}
              <View style={styles.vocabInfoCol}>
                <View style={styles.vocabWordRow}>
                  <Text style={styles.vocabWord}>{item.word}</Text>
                </View>

                <Text style={styles.vocabDesc} numberOfLines={1}>
                  {item.description}
                </Text>

                <View style={styles.vocabCardFooter}>
                  <View />

                  {/* AI Camera practice shortcut button */}
                  <TouchableOpacity
                    style={styles.cameraPracticeMiniBtn}
                    onPress={(event) => {
                      event.stopPropagation();
                      navigation.navigate('AICamera', { sign: item });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Luyện AI ký hiệu ${item.word}`}
                  >
                    <MaterialIcons name="center-focus-strong" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lessonSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  lessonIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  lessonBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
    marginTop: 2,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  infoIconBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  topicEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCardCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  headerCardTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.onSurface,
    marginTop: 2,
  },
  progressBox: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabelText: {
    ...TYPOGRAPHY.label,
    color: COLORS.onSurface,
  },
  progressPercentText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mainAction: { flexGrow: 1, flexBasis: 170 },
  sideAction: { flexGrow: 1, flexBasis: 120 },
  tabsScroller: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  activeTabChip: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  activeTabChipText: {
    color: COLORS.onPrimary,
  },
  vocabFeed: {
    gap: SPACING.sm,
  },
  vocabItemCard: {
    ...SURFACES.card,
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
    alignItems: 'center',
  },
  thumbBox: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceContainer,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  thumbDurationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  vocabInfoCol: {
    flex: 1,
    gap: 4,
  },
  vocabWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  vocabDesc: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  vocabCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cameraPracticeMiniBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
