import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE } from '../constants/theme';
import Header from '../components/Header';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetAllSigns()
      .then((data) => {
        const signs = Array.isArray(data) ? data.map(mapSign) : [];
        setAllSigns(signs);
        setQuestions(buildQuestions(signs));
      })
      .catch((err) => { console.warn('Lỗi tải dữ liệu Quiz:', err.message); setError(err.message || 'Không tải được bài ôn tập.'); })
      .finally(() => setLoading(false));
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    if (selectedOption.isCorrect) {
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <Header title="Ôn tập" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Text style={styles.emptyText}>
              {error || 'Chưa có đủ dữ liệu ký hiệu để tạo bài ôn tập.'}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <Header title="Kết quả ôn tập" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
        <View style={styles.completedContainer}>
          <View style={styles.trophyCircle}>
            <MaterialIcons name="emoji-events" size={64} color={COLORS.secondaryContainer} />
          </View>
          <Text style={styles.completeTitle}>Đã hoàn thành bài ôn tập</Text>
          <Text style={styles.completeSub}>
            Xem lại kết quả và tiếp tục luyện tập khi bạn muốn.
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

          <TouchableOpacity style={styles.primaryActionButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.primaryActionText}>Về trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton} onPress={handleRestart}>
            <Text style={styles.secondaryActionText}>Làm lại bài kiểm tra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <Header
        title={`Ôn tập · Câu ${currentIndex + 1}/${questions.length}`}
        showBack={navigation.canGoBack()}
        onBack={() => navigation.goBack()}
      />

      {/* Progress Bar */}
      <View style={styles.topProgressTrack}>
        <View
          style={[
            styles.topProgressFill,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.hintText}>Gợi ý: {currentQ.hint}</Text>
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

            if (!isSubmitted && isSelected) {
              cardStyle = styles.choiceCardSelected;
            }
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
                disabled={isSubmitted}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isSubmitted }}
                activeOpacity={isSubmitted ? 1 : 0.85}
              >
                <View style={styles.choiceLeftRow}>
                  <View style={[styles.choiceBadge, badgeStyle]}>
                    <Text style={styles.choiceBadgeText}>{option.id}</Text>
                  </View>
                  <Text style={[styles.choiceText, textStyle]}>{option.text}</Text>
                </View>

                {isSubmitted && isCorrectOption && (
                  <View style={styles.correctBanner}>
                    <MaterialIcons name="check-circle" size={16} color={COLORS.onTertiary} />
                    <Text style={styles.correctBannerText}>Đúng</Text>
                  </View>
                )}

                {isSubmitted && isSelected && !isCorrectOption && (
                  <View style={styles.wrongBanner}>
                    <MaterialIcons name="cancel" size={16} color={COLORS.error} />
                    <Text style={{ color: COLORS.error, fontWeight: '700' }}>Sai</Text>
                  </View>
                )}

                {!isSubmitted && (
                  <MaterialIcons
                    name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
                    size={20}
                    color={COLORS.outlineVariant}
                  />
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
                  color={selectedOption?.isCorrect ? COLORS.tertiaryContainer : COLORS.secondary}
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
      {(selectedOption || isSubmitted) && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.continueButton} onPress={isSubmitted ? handleNext : handleSubmit} activeOpacity={0.85}>
            <Text style={styles.continueButtonText}>
              {!isSubmitted ? 'Kiểm tra đáp án' : currentIndex + 1 < questions.length ? 'Tiếp tục câu sau' : 'Xem kết quả'}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.onPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.margin,
  },
  emptyText: {
    fontSize: TYPE.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
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
  topProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    width: '100%', maxWidth: 700, alignSelf: 'center',
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  videoPlayerBox: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.inverseSurface,
    position: 'relative',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  videoImg: {
    width: '100%',
    height: '100%',
  },
  questionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  questionText: {
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  hintText: {
    fontSize: TYPE.caption,
    color: COLORS.onSurfaceVariant,
    marginTop: 6,
  },
  choicesCol: {
    gap: SPACING.sm,
  },
  choiceCard: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  choiceCardDefault: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choiceCardSelected: { backgroundColor: COLORS.primaryContainer, borderWidth: 2, borderColor: COLORS.primary },
  choiceCardCorrect: {
    backgroundColor: COLORS.tertiaryFixed,
    borderWidth: 1.5,
    borderColor: COLORS.tertiaryContainer,
  },
  choiceCardWrong: {
    backgroundColor: COLORS.errorContainer,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  choiceLeftRow: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
    backgroundColor: COLORS.successContainer,
  },
  choiceBadgeWrong: {
    backgroundColor: COLORS.errorContainer,
  },
  choiceBadgeText: {
    fontSize: TYPE.bodySmall,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  choiceText: {
    flexShrink: 1,
    fontSize: TYPE.body,
    fontWeight: '600',
    color: COLORS.onSurface,
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
    backgroundColor: COLORS.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  correctBannerText: {
    fontSize: TYPE.caption,
    fontWeight: '700',
    color: COLORS.onTertiary,
  },
  wrongBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    padding: 4,
  },
  feedbackBanner: {
    backgroundColor: COLORS.surfaceContainerLow,
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
    fontSize: TYPE.bodySmall,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  feedbackExplanation: {
    fontSize: TYPE.bodySmall,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceContainerHigh,
    ...SHADOWS.lg,
  },
  continueButton: {
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  continueButtonText: {
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  completedContainer: {
    width: '100%', maxWidth: 700, alignSelf: 'center',
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  completeTitle: {
    fontSize: TYPE.title,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  completeSub: {
    fontSize: TYPE.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
  },
  resultCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginVertical: SPACING.xl,
    ...SHADOWS.sm,
  },
  resultCol: {
    flex: 1,
    alignItems: 'center',
  },
  resultBig: {
    fontSize: TYPE.headline,
    fontWeight: '800',
    color: COLORS.primary,
  },
  resultLabel: {
    fontSize: TYPE.caption,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  primaryActionButton: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  primaryActionText: {
    fontSize: TYPE.body,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  secondaryActionButton: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: TYPE.bodySmall,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});
