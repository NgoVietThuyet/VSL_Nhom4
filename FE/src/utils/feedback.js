import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Rung phản hồi. Với người khiếm thính, rung + hình ảnh thay cho âm thanh.
// Web không có rung nên bỏ qua; lỗi thiết bị cũng không được làm app dừng.
const run = (fn) => {
  if (Platform.OS === 'web') return;
  try {
    Promise.resolve(fn()).catch(() => {});
  } catch (e) {
    // bỏ qua
  }
};

export const feedback = {
  tap: () => run(() => Haptics.selectionAsync()),
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
