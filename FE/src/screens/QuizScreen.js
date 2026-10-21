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
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
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

  useEffect(() => {
    apiGetAllSigns()
      .then((data) => {
        const signs = Array.isArray(data) ? data.map(mapSign) : [];
        setAllSigns(signs);
        setQuestions(buildQuestions(signs));
      })
      .catch((err) => console.warn('Lỗi tải dữ liệu Quiz:', err.message))
      .finally(() => setLoading(false));
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Quiz" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Text style={styles.emptyText}>
              Chưa có đủ dữ liệu ký hiệu để tạo bài Quiz.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Kết Quả Bài Quiz" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.completedContainer}>
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

          <TouchableOpacity style={styles.primaryActionButton} onPress={() => navigation.navigate('Home')}>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title={`Quiz: Câu ${currentIndex + 1}/${questions.length}`}
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
            <Text style={styles.hintText}>💡 {currentQ.hint}</Text>
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
                    <Text style={styles.correctBannerText}>ĐÚNG! 🎉</Text>
                  </View>
                )}

                {isSubmitted && isSelected && !isCorrectOption && (
                  <View style={styles.wrongBanner}>
                    <MaterialIcons name="cancel" size={16} color={COLORS.error} />
                  </View>
                )}

                {!isSubmitted && (
                  <MaterialIcons
                    name="radio-button-unchecked"
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
      {isSubmitted && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.continueButton} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.continueButtonText}>
              {currentIndex + 1 < questions.length ? 'Tiếp tục câu sau' : 'Xem kết quả bài Quiz'}
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
    fontSize: 14,
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
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
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.md,
    paddingBottom: 90,
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
  speedPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tertiaryFixed,
  },
  speedPillText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  replayButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  replayText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 6,
  },
  choicesCol: {
    gap: SPACING.sm,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  choiceCardDefault: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
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
    flexDirection: 'row',
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
    backgroundColor: COLORS.tertiaryContainer,
  },
  choiceBadgeWrong: {
    backgroundColor: COLORS.error,
  },
  choiceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  choiceText: {
    fontSize: 15,
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onTertiary,
  },
  wrongBanner: {
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  completedContainer: {
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
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
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
    fontSize: 15,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});
