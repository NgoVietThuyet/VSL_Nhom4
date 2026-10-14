import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { VOCABULARY_LIST } from '../data/mockData';
import { apiSubmitPractice } from '../api/apiClient';
import HandLandmarksSVG from '../components/HandLandmarksSVG';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AICameraScreen({ route, navigation }) {
  const sign = route.params?.sign || VOCABULARY_LIST[0];

  const [accuracy, setAccuracy] = useState(94);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Simulated live accuracy fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setAccuracy(Math.floor(92 + Math.random() * 6));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = async () => {
    setEvaluating(true);
    const currentAccuracy = accuracy;
    const isPassed = currentAccuracy >= 80;
    const signId = sign.signId || 1;

    try {
      await apiSubmitPractice(signId, {
        inputMode: 'camera',
        predictedLabel: sign.word,
        confidence: currentAccuracy / 100,
        isCorrect: isPassed,
      });
    } catch (err) {
      console.warn('Lưu kết quả luyện tập Backend:', err.message);
    } finally {
      setEvaluating(false);
      setShowSuccessModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Live Mockup Feed */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
        }}
        style={styles.cameraFeed}
      />

      {/* Dark Vignette Overlay */}
      <View style={styles.vignetteOverlay} />

      {/* Real-time Hand Landmarks SVG Wireframe */}
      {showSkeleton && (
        <View style={styles.skeletonContainer}>
          <HandLandmarksSVG width={SCREEN_WIDTH * 0.9} height={SCREEN_HEIGHT * 0.55} />
        </View>
      )}

      {/* Target Bounding Box Guide */}
      <View style={styles.boundingBox}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Text style={styles.boxGuideText}>Đặt bàn tay vào trong khung</Text>
      </View>

      {/* Top Floating HUD Bar */}
      <SafeAreaView style={styles.topHudContainer}>
        <View style={styles.topHudRow}>
          <TouchableOpacity
            style={styles.circleHudBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Current Target Sign Badge */}
          <View style={styles.targetSignBadge}>
            <Text style={styles.targetSignLabel}>KÝ HIỆU MỤC TIÊU</Text>
            <Text style={styles.targetSignWord}>{sign.word}</Text>
          </View>

          <TouchableOpacity
            style={styles.circleHudBtn}
            onPress={() => setShowSkeleton(!showSkeleton)}
          >
            <MaterialIcons
              name={showSkeleton ? 'visibility' : 'visibility-off'}
              size={22}
              color={showSkeleton ? COLORS.primaryFixed : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Real-time AI Accuracy Pill */}
        <View style={styles.accuracyFloatRow}>
          <View style={styles.accuracyPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.accuracyScoreText}>{accuracy}% Khớp</Text>
            <View style={styles.pipeDivider} />
            <Text style={styles.accuracyHintText}>Tư thế chuẩn xác!</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Controls Panel */}
      <SafeAreaView style={styles.bottomHudContainer}>
        {/* Dynamic AI Feedback Tip Card */}
        <View style={styles.feedbackCard}>
          <MaterialIcons name="tips-and-updates" size={18} color={COLORS.secondaryContainer} />
          <Text style={styles.feedbackText} numberOfLines={2}>
            Gợi ý: Giữ bàn tay ngang tầm mắt, các ngón tay khép nhẹ tự nhiên.
          </Text>
        </View>

        {/* Shutter and controls row */}
        <View style={styles.controlsRow}>
          {/* Flip camera */}
          <TouchableOpacity
            style={styles.sideControlBtn}
            onPress={() => setIsFrontCamera(!isFrontCamera)}
          >
            <MaterialIcons name="flip-camera-android" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Shutter evaluate button */}
          <TouchableOpacity
            style={[styles.shutterBtn, evaluating && { transform: [{ scale: 0.95 }] }]}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={evaluating}
          >
            <View style={styles.shutterInnerCircle}>
              {evaluating ? (
                <MaterialIcons name="hourglass-empty" size={32} color={COLORS.primary} />
              ) : (
                <MaterialIcons name="camera" size={36} color={COLORS.primary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Flash toggle */}
          <TouchableOpacity
            style={styles.sideControlBtn}
            onPress={() => setIsFlashOn(!isFlashOn)}
          >
            <MaterialIcons
              name={isFlashOn ? 'flash-on' : 'flash-off'}
              size={24}
              color={isFlashOn ? COLORS.secondaryFixed : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Success AI Evaluation Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <MaterialIcons name="check-circle" size={48} color={COLORS.tertiary} />
            </View>

            <Text style={styles.modalTitle}>XUẤT SẮC! 🎉</Text>
            <Text style={styles.modalSub}>
              Cử chỉ "{sign.word}" của bạn đạt độ chuẩn xác rất cao.
            </Text>

            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreBigNum}>96%</Text>
                <Text style={styles.scoreLabel}>Độ chính xác AI</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreBigNum, { color: COLORS.secondaryContainer }]}>+25</Text>
                <Text style={styles.scoreLabel}>Điểm XP thưởng</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Lưu kết quả & Tiếp tục</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalSecondaryBtnText}>Luyện lại lần nữa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraFeed: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  skeletonContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.18,
    left: SCREEN_WIDTH * 0.05,
    right: SCREEN_WIDTH * 0.05,
    height: SCREEN_HEIGHT * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingBox: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.22,
    left: SCREEN_WIDTH * 0.12,
    right: SCREEN_WIDTH * 0.12,
    height: SCREEN_HEIGHT * 0.44,
    borderWidth: 1.5,
    borderColor: 'rgba(156,242,232,0.4)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primaryFixed,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  boxGuideText: {
    fontSize: 11,
    color: COLORS.primaryFixed,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  topHudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.margin,
    paddingTop: 10,
  },
  topHudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleHudBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetSignBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  targetSignLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryFixed,
    letterSpacing: 0.5,
  },
  targetSignWord: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginTop: 1,
  },
  accuracyFloatRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  accuracyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,33,19,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.tertiaryFixed,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tertiaryFixed,
  },
  accuracyScoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.tertiaryFixed,
  },
  pipeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  accuracyHintText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  bottomHudContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.margin,
    paddingBottom: 24,
    gap: SPACING.md,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: RADIUS.lg,
    padding: 10,
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    lineHeight: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  sideControlBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalSuccessIcon: {
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  modalSub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
    width: '100%',
  },
  scoreBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  scoreBigNum: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});
