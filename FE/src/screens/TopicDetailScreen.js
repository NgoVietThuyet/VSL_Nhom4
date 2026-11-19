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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE } from '../constants/theme';
import { apiGetTopicSigns, apiGetTopicLessons } from '../api/apiClient';
import { mapSign, mapLesson } from '../api/mappers';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';

export default function TopicDetailScreen({ route, navigation }) {
  const topic = route.params?.topic;

  const [vocabList, setVocabList] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, single, phrases

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
      if (Array.isArray(signData)) {
        setVocabList(signData.map(mapSign));
      }
      if (Array.isArray(lessonData)) {
        setLessons(lessonData.map(mapLesson));
      }
      setError('');
    } catch (err) {
      console.warn('Lỗi kết nối Signs API:', err.message);
      setError(err.message || 'Không tải được nội dung chủ đề.');
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Chủ đề" showBack={true} onBack={() => navigation.goBack()} />
        <Text style={styles.emptyText}>Không tìm thấy chủ đề.</Text>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title={topic.number ? `Chủ đề ${topic.number}: ${topic.title}` : topic.title}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity accessibilityLabel="Thông tin chủ đề" style={styles.infoIconBtn} onPress={() => Alert.alert('Thông tin chủ đề', topic.description || 'Chưa có mô tả.')}>
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
        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginBottom: SPACING.lg }} />}
        {!!error && <View style={{ marginBottom: SPACING.lg, gap: SPACING.sm }}><Text style={styles.emptyText} accessibilityLiveRegion="polite">{error}</Text><ActionButton label="Thử tải lại" variant="secondary" onPress={fetchSigns} /></View>}
        {/* Topic Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.topicMetaRow}>
            <View style={styles.topicEmojiWrap}>
              <MaterialIcons name="sign-language" size={30} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              {!!topic.level && <Text style={styles.headerCardCategory}>{topic.level}</Text>}
              <Text style={styles.headerCardTitle}>{topic.title}</Text>
            </View>
          </View>

          {/* Progress Tracker (chỉ hiển thị khi Backend trả về tiến độ) */}
          {hasProgress && (
            <View style={styles.progressBox}>
              <View style={styles.progressTopRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabelText}>Tiến độ chủ đề</Text>
                </View>
                <Text style={styles.progressPercentText}>{topic.progress}%</Text>
              </View>

              {/* Linear Progress Bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${topic.progress}%` }]} />
              </View>

              <View style={styles.progressDetailRow}>
                <Text style={styles.progressDetailText}>
                  Đã thuần thục: <Text style={{ fontWeight: '700', color: COLORS.onSurface }}>{topic.completedSigns ?? '—'}</Text> / {topic.signsCount ?? vocabList.length} ký hiệu
                </Text>
              </View>
            </View>
          )}

          {/* Quick Action Dual Buttons */}
          {vocabList.length > 0 && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.continueLearnBtn}
                onPress={() => navigation.navigate('SignDetail', { sign: vocabList[0] })}
                activeOpacity={0.85}
              >
                <MaterialIcons name="play-circle" size={20} color={COLORS.onPrimary} />
                <Text style={styles.continueLearnText}>Tiếp tục học ngay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiPracticeBtn}
                onPress={() => navigation.navigate('AICamera', { sign: vocabList[0] })}
                activeOpacity={0.85}
              >
                <MaterialIcons name="videocam" size={20} color={COLORS.primary} />
                <Text style={styles.aiPracticeText}>Luyện AI</Text>
              </TouchableOpacity>
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

        <Text style={styles.sectionHeading}>Tất cả ký hiệu</Text>

        {/* Filter Tabs Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroller}
        >
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'all' && styles.activeTabChip]}
            accessibilityState={{ selected: activeTab === 'all' }}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabChipText, activeTab === 'all' && styles.activeTabChipText]}>
              Tất cả ({vocabList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'single' && styles.activeTabChip]}
            accessibilityState={{ selected: activeTab === 'single' }}
            onPress={() => setActiveTab('single')}
          >
            <Text style={[styles.tabChipText, activeTab === 'single' && styles.activeTabChipText]}>
              Ký hiệu đơn ({singleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'phrases' && styles.activeTabChip]}
            accessibilityState={{ selected: activeTab === 'phrases' }}
            onPress={() => setActiveTab('phrases')}
          >
            <Text style={[styles.tabChipText, activeTab === 'phrases' && styles.activeTabChipText]}>
              Câu giao tiếp ({phrasesCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Vocabulary Sign Feed List */}
        {!loading && !error && filteredVocab.length === 0 && (
          <Text style={styles.emptyText}>Chưa có ký hiệu nào.</Text>
        )}
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
                    accessibilityLabel={`Luyện ký hiệu ${item.word}`}
                    style={styles.cameraPracticeMiniBtn}
                    onPress={() => navigation.navigate('AICamera', { sign: item })}
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
  emptyText: {
    fontSize: TYPE.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  lessonSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  lessonIndex: {
    fontSize: TYPE.caption,
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
    width: '100%', maxWidth: 700, alignSelf: 'center',
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },
  infoIconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
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
    fontSize: TYPE.caption,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  headerCardTitle: {
    fontSize: TYPE.title,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  progressBox: {
    paddingVertical: SPACING.md,
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
    fontSize: TYPE.bodySmall,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  progressPercentText: {
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  progressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailText: {
    fontSize: TYPE.caption,
    color: COLORS.onSurfaceVariant,
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  continueLearnBtn: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  continueLearnText: {
    fontSize: TYPE.bodySmall,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  aiPracticeBtn: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  aiPracticeText: {
    fontSize: TYPE.bodySmall,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabsScroller: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tabChip: {
    minHeight: 44, justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  activeTabChip: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: TYPE.bodySmall,
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
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    gap: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
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
    backgroundColor: COLORS.inverseSurface,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  thumbDurationText: {
    fontSize: TYPE.caption,
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
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  vocabDesc: {
    fontSize: TYPE.caption,
    color: COLORS.onSurfaceVariant,
  },
  vocabCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cameraPracticeMiniBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
