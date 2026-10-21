import React, { useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { apiGetTopicSigns } from '../api/apiClient';
import { mapSign } from '../api/mappers';
import Header from '../components/Header';

export default function TopicDetailScreen({ route, navigation }) {
  const topic = route.params?.topic;

  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, single, phrases

  const fetchSigns = async () => {
    try {
      const topicId = topic?.topicId || topic?.id;
      if (!topicId) return;
      const data = await apiGetTopicSigns(topicId);
      if (Array.isArray(data)) {
        setVocabList(data.map(mapSign));
      }
    } catch (err) {
      console.warn('Lỗi kết nối Signs API:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSigns();
  }, [topic]);

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
          <TouchableOpacity style={styles.infoIconBtn} onPress={() => Alert.alert('Thông tin chủ đề', topic.description || 'Chưa có mô tả.')}>
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
              <Text style={{ fontSize: 32 }}>{topic.emoji}</Text>
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
                  Đã thuần thục: <Text style={{ fontWeight: '700', color: COLORS.onSurface }}>{topic.completedSigns ?? 0}</Text> / {topic.signsCount ?? vocabList.length} ký hiệu
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

        {/* Filter Tabs Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroller}
        >
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'all' && styles.activeTabChip]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabChipText, activeTab === 'all' && styles.activeTabChipText]}>
              Tất cả ({vocabList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'single' && styles.activeTabChip]}
            onPress={() => setActiveTab('single')}
          >
            <Text style={[styles.tabChipText, activeTab === 'single' && styles.activeTabChipText]}>
              Ký hiệu đơn ({singleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'phrases' && styles.activeTabChip]}
            onPress={() => setActiveTab('phrases')}
          >
            <Text style={[styles.tabChipText, activeTab === 'phrases' && styles.activeTabChipText]}>
              Câu giao tiếp ({phrasesCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Vocabulary Sign Feed List */}
        {!loading && filteredVocab.length === 0 && (
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
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: SPACING.lg,
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
    paddingBottom: 40,
  },
  infoIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  headerCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  progressBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  streakHotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  streakHotText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  progressPercentText: {
    fontSize: 16,
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
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  progressRemainingText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  continueLearnBtn: {
    flex: 3,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  continueLearnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  aiPracticeBtn: {
    flex: 2,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  aiPracticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tabsScroller: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
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
  masteredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  masteredTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onTertiaryFixed,
  },
  cameraPracticeMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
