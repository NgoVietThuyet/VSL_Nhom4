import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, CONTENT_MAX_WIDTH } from '../constants/theme';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';
import ScreenState from '../components/ScreenState';
import ProgressBar from '../components/ProgressBar';
import { apiGetAllSigns } from '../api/apiClient';
import { mapSign } from '../api/mappers';

const QUESTION_COUNT = 5;
const POINTS_PER_QUESTION = 25;
const OPTION_IDS = ['A', 'B', 'C', 'D'];

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sinh câu hỏi trắc nghiệm từ danh sách ký hiệu thật: xem ký hiệu -> chọn nghĩa đúng
function buildQuestions(signs) {
  const usable = signs.filter((s) => s.word);
  return shuffle(usable)
    .slice(0, QUESTION_COUNT)
    .map((sign) => {
      const distractors = shuffle(usable.filter((s) => s.signId !== sign.signId && s.word !== sign.word))
        .slice(0, OPTION_IDS.length - 1);
      const options = shuffle([sign, ...distractors]).map((s, idx) => ({
        id: OPTION_IDS[idx],
        text: s.word,
        isCorrect: s.signId === sign.signId,
      }));
      return {
        id: `q_${sign.signId}`,
        question: 'Ký hiệu trong hình trên có ý nghĩa gì trong VSL?',
        videoThumb: sign.videoThumb,
        hint: sign.description,
        options,
        explanation: `Đáp án đúng: "${sign.word}".${sign.description ? ` ${sign.description}` : ''}`,
        points: POINTS_PER_QUESTION,
      };
    });
}

export default function QuizScreen({ navigation }) {
  const [questions, setQuestions] = useState([]);
  const [allSigns, setAllSigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadQuestions = () => {
    setLoading(true);
    setError(null);
    apiGetAllSigns()
      .then((data) => {
        const signs = Array.isArray(data) ? data.map(mapSign) : [];
        setAllSigns(signs);
        setQuestions(buildQuestions(signs));
      })
      .catch((err) => {
        console.warn('Lỗi tải dữ liệu Quiz:', err.message);
        setError(err.message || 'Không thể tải dữ liệu bài Quiz.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
    setIsSubmitted(true);

    if (option.isCorrect) {
      setScore((prev) => prev + currentQ.points);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setQuestions(buildQuestions(allSigns));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  if (loading || !currentQ) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Header title="Quiz" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
        <ScreenState kind={loading ? 'loading' : error ? 'error' : 'empty'}
          title={loading ? 'Đang tải bài Quiz' : error ? 'Không tải được bài Quiz' : 'Chưa có đủ dữ liệu ký hiệu'}
          message={loading ? undefined : error || 'Bài Quiz sẽ có khi có thêm ký hiệu để luyện tập.'}
          actionLabel={error ? 'Thử lại' : undefined} onAction={error ? loadQuestions : undefined}
          style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Header title="Kết Quả Bài Quiz" showBack={true} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.completedContainer}>
          <View style={styles.trophyCircle}>
            <MaterialIcons name="emoji-events" size={64} color={COLORS.secondaryContainer} />
          </View>
          <Text style={styles.completeTitle}>XUẤT SẮC HOÀN THÀNH!</Text>
          <Text style={styles.completeSub}>
            Bạn đã vượt qua bài kiểm tra ôn luyện kiến thức VSL.
          </Text>

          <View style={styles.resultCard}>
            <View style={styles.resultCol}>
              <Text style={styles.resultBig}>{score} / {questions.length * POINTS_PER_QUESTION}</Text>
              <Text style={styles.resultLabel}>Tổng điểm đạt</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCol}>
              <Text style={[styles.resultBig, { color: COLORS.secondaryContainer }]}>
                {score / POINTS_PER_QUESTION} / {questions.length}
              </Text>
              <Text style={styles.resultLabel}>Số câu đúng</Text>
            </View>
          </View>

          <ActionButton label="Về trang chủ" onPress={() => navigation.navigate('Home')}
            style={{ width: '100%', marginBottom: SPACING.sm }} />
          <ActionButton label="Làm lại bài kiểm tra" onPress={handleRestart} variant="secondary"
            style={{ width: '100%' }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title={`Quiz: Câu ${currentIndex + 1}/${questions.length}`}
        showBack={navigation.canGoBack()}
        onBack={() => navigation.goBack()}
      />

      {/* Progress Bar */}
      <ProgressBar label="Tiến độ bài Quiz" progress={((currentIndex + 1) / questions.length) * 100}
        style={styles.topProgressTrack} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Video / Demonstration Player */}
        <View style={styles.videoPlayerBox}>
          {currentQ.videoThumb ? (
            <Image source={{ uri: currentQ.videoThumb }} style={styles.videoImg} />
          ) : (
            <View style={[styles.videoImg, styles.videoPlaceholder]}>
              <MaterialIcons name="sign-language" size={56} color={COLORS.outline} />
            </View>
          )}
        </View>

        {/* Question Title */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          {!!currentQ.hint && isSubmitted === false && (
            <View style={styles.hintRow}>
              <MaterialIcons name="lightbulb-outline" size={18} color={COLORS.warning} />
              <Text style={styles.hintText}>{currentQ.hint}</Text>
            </View>
          )}
        </View>

        {/* 4 Interactive Choices */}
        <View style={styles.choicesCol}>
          {currentQ.options.map((option) => {
            const isSelected = selectedOption?.id === option.id;
            const isCorrectOption = option.isCorrect;

            let cardStyle = styles.choiceCardDefault;
            let badgeStyle = styles.choiceBadgeDefault;
            let textStyle = styles.choiceTextDefault;

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyle = styles.choiceCardCorrect;
                badgeStyle = styles.choiceBadgeCorrect;
                textStyle = styles.choiceTextCorrect;
              } else if (isSelected && !isCorrectOption) {
                cardStyle = styles.choiceCardWrong;
                badgeStyle = styles.choiceBadgeWrong;
                textStyle = styles.choiceTextWrong;
              }
            }

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.choiceCard, cardStyle]}
                onPress={() => handleSelect(option)}
                activeOpacity={isSubmitted ? 1 : 0.85}
                disabled={isSubmitted}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isSubmitted }}
                accessibilityLabel={`${option.id}: ${option.text}${isSubmitted ? (isCorrectOption ? ', đáp án đúng' : isSelected ? ', đáp án đã chọn, chưa đúng' : '') : ''}`}
              >
                <View style={styles.choiceLeftRow}>
                  <View style={[styles.choiceBadge, badgeStyle]}>
                    <Text style={styles.choiceBadgeText}>{option.id}</Text>
                  </View>
                  <Text style={[styles.choiceText, textStyle]}>{option.text}</Text>
                </View>

                {isSubmitted && isCorrectOption && (
                  <View style={styles.correctBanner}>
                    <MaterialIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.correctBannerText}>Đúng</Text>
                  </View>
                )}

                {isSubmitted && isSelected && !isCorrectOption && (
                  <View style={styles.wrongBanner}>
                    <MaterialIcons name="cancel" size={16} color={COLORS.error} />
                  </View>
                )}

              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation Card upon submission */}
        {isSubmitted && (
          <View style={styles.feedbackBanner}>
            <View style={styles.feedbackBannerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons
                  name={selectedOption?.isCorrect ? 'thumb-up' : 'info'}
                  size={20}
                  color={selectedOption?.isCorrect ? COLORS.success : COLORS.secondary}
                />
                <Text style={styles.feedbackHeading}>
                  {selectedOption?.isCorrect ? `Tuyệt vời! +${currentQ.points} điểm` : 'Giải thích đáp án'}
                </Text>
              </View>
            </View>
            <Text style={styles.feedbackExplanation}>{currentQ.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {isSubmitted && (
        <View style={styles.bottomBar}>
          <ActionButton label={currentIndex + 1 < questions.length ? 'Tiếp tục câu sau' : 'Xem kết quả bài Quiz'}
            onPress={handleNext} icon="arrow-forward"
            style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  videoPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  topProgressTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  videoPlayerBox: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.inverseSurface,
    position: 'relative',
    marginBottom: SPACING.md,
  },
  videoImg: {
    width: '100%',
    height: '100%',
  },
  questionCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  questionText: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  choicesCol: {
    gap: SPACING.sm,
  },
  choiceCard: {
    ...SURFACES.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    minHeight: 56,
    padding: SPACING.md,
  },
  choiceCardDefault: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  choiceCardCorrect: {
    backgroundColor: COLORS.successContainer,
    borderColor: COLORS.success,
  },
  choiceCardWrong: {
    backgroundColor: COLORS.errorContainer,
    borderColor: COLORS.error,
  },
  choiceLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
    minWidth: 0,
  },
  choiceBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBadgeDefault: {
    backgroundColor: COLORS.surfaceContainer,
  },
  choiceBadgeCorrect: {
    backgroundColor: COLORS.tertiaryContainer,
  },
  choiceBadgeWrong: {
    backgroundColor: COLORS.errorContainer,
  },
  choiceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  choiceText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  choiceTextDefault: {
    color: COLORS.onSurface,
  },
  choiceTextCorrect: {
    color: COLORS.onTertiaryFixed,
    fontWeight: '800',
  },
  choiceTextWrong: {
    color: COLORS.error,
  },
  correctBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  correctBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.success,
  },
  wrongBanner: {
    padding: 4,
  },
  feedbackBanner: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: 6,
  },
  feedbackBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  feedbackExplanation: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  completedContainer: {
    flexGrow: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  completeSub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
  },
  resultCard: {
    ...SURFACES.card,
    flexDirection: 'row',
    width: '100%',
    padding: SPACING.lg,
    marginVertical: SPACING.xl,
  },
  resultCol: {
    flex: 1,
    alignItems: 'center',
  },
  resultBig: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  resultLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
});
