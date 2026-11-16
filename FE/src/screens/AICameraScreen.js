import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY, CONTENT_MAX_WIDTH } from '../constants/theme';

export default function AICameraScreen({ route, navigation }) {
  const sign = route.params?.sign?.word ? route.params.sign : null;
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const handleCapture = () => {
    if (!sign) {
      Alert.alert('Chưa chọn ký hiệu', 'Hãy chọn một ký hiệu trong mục Chủ đề để luyện tập.', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Đến Chủ đề', onPress: () => navigation.navigate('MainTabs', { screen: 'Topics' }) },
      ]);
      return;
    }
    Alert.alert('Chưa hỗ trợ', 'Tính năng nhận diện cử chỉ bằng AI Camera chưa được tích hợp.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={COLORS.inverseSurface} />
      <View style={styles.content}>
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}
              accessibilityRole="button" accessibilityLabel="Quay lại">
              <MaterialIcons name="arrow-back" size={24} color={COLORS.inverseOnSurface} />
            </TouchableOpacity>
          ) : <View style={styles.headerSpacer} />}
          <View style={styles.target}>
            <Text style={styles.targetLabel}>Ký hiệu mục tiêu</Text>
            <Text style={styles.targetWord} numberOfLines={2}>{sign?.word || 'Chưa chọn'}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.preview} accessibilityLiveRegion="polite">
          <View style={styles.previewIcon}>
            <MaterialIcons name="videocam-off" size={36} color={COLORS.primaryFixed} />
          </View>
          <Text style={styles.previewTitle}>Camera chưa khả dụng</Text>
          <Text style={styles.previewText}>
            Chức năng nhận diện cử chỉ chưa được tích hợp.
          </Text>
          <View style={styles.previewStatus}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.primaryFixed} />
            <Text style={styles.previewStatusText}>Không yêu cầu quyền camera lúc này</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!!sign?.description && (
            <View style={styles.tip}>
              <MaterialIcons name="tips-and-updates" size={20} color={COLORS.secondaryFixed} />
              <Text style={styles.tipText}>Gợi ý: {sign.description}</Text>
            </View>
          )}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.sideControl} onPress={() => setIsFrontCamera(!isFrontCamera)}
              accessibilityRole="button" accessibilityLabel="Đổi hướng camera"
              accessibilityState={{ selected: isFrontCamera }}>
              <MaterialIcons name="flip-camera-android" size={24} color={COLORS.inverseOnSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.capture} onPress={handleCapture}
              accessibilityRole="button" accessibilityLabel="Kiểm tra ký hiệu">
              <MaterialIcons name="photo-camera-front" size={30} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideControl} onPress={() => setIsFlashOn(!isFlashOn)}
              accessibilityRole="button" accessibilityLabel={isFlashOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
              accessibilityState={{ selected: isFlashOn }}>
              <MaterialIcons name={isFlashOn ? 'flash-on' : 'flash-off'} size={24}
                color={isFlashOn ? COLORS.secondaryFixed : COLORS.inverseOnSurface} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.inverseSurface },
  content: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inverseSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: TOUCH_TARGET },
  target: { flex: 1, alignItems: 'center' },
  targetLabel: { ...TYPOGRAPHY.caption, color: COLORS.primaryFixed },
  targetWord: { ...TYPOGRAPHY.section, color: COLORS.inverseOnSurface, textAlign: 'center' },
  preview: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  previewIcon: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inverseSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  previewTitle: { ...TYPOGRAPHY.title, color: COLORS.inverseOnSurface, textAlign: 'center' },
  previewText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primaryFixed,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  previewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  previewStatusText: { ...TYPOGRAPHY.caption, color: COLORS.primaryFixed, flexShrink: 1 },
  footer: { paddingHorizontal: SPACING.margin, paddingBottom: SPACING.lg },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.inverseSurfaceRaised,
    borderRadius: RADIUS.md,
  },
  tipText: { ...TYPOGRAPHY.body, color: COLORS.inverseOnSurface, flex: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
  },
  sideControl: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inverseSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capture: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inverseOnSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
