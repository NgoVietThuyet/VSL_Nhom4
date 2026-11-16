import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGET, CONTENT_MAX_WIDTH } from '../constants/theme';
import { apiRegister } from '../api/apiClient';
import FormField from '../components/FormField';
import ActionButton from '../components/ActionButton';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên của bạn.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ email.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email (ví dụ: name@gmail.com).');
      return false;
    }

    if (!password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có tối thiểu 6 ký tự để đảm bảo bảo mật.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.');
      return false;
    }

    if (!agreeTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await apiRegister(
        fullName.trim(),
        email.trim().toLowerCase(),
        password,
        phone.trim()
      );

      const registeredUser = res?.data?.user;
      Alert.alert(
        'Đăng ký thành công 🎉',
        `Chào mừng ${registeredUser?.fullName || fullName} đã gia nhập cộng đồng Ký Hiệu Việt!`,
        [
          {
            text: 'Bắt đầu học ngay',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Đăng ký thất bại', err.message || 'Không thể tạo tài khoản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.surface }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Quay lại đăng nhập"
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Ký Hiệu Việt</Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.welcomeHeading}>Tạo tài khoản</Text>
            <Text style={styles.welcomeDesc}>Bắt đầu học ngôn ngữ ký hiệu Việt Nam.</Text>
          </View>

          {/* Form Container */}
          <View>
            {/* Full Name input */}
            <FormField label="Họ và tên" icon="person-outline" value={fullName}
              onChangeText={setFullName} placeholder="Ví dụ: Nguyễn Văn An" autoCapitalize="words" />

            {/* Email input */}
            <FormField label="Địa chỉ Email" icon="mail-outline" value={email}
              onChangeText={setEmail} placeholder="vidu@domain.com"
              keyboardType="email-address" autoCapitalize="none" />

            {/* Phone input (optional) */}
            <FormField label="Số điện thoại" icon="phone-iphone" optional value={phone}
              onChangeText={setPhone} placeholder="0912 345 678" keyboardType="phone-pad" />

            {/* Password input */}
            <FormField label="Mật khẩu" icon="lock-outline" value={password}
              onChangeText={setPassword} placeholder="Tối thiểu 6 ký tự" secure />

            {/* Confirm Password input */}
            <FormField label="Xác nhận mật khẩu" icon="lock-clock" value={confirmPassword}
              onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu ở trên" secure />

            {/* Terms Agreement Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityLabel="Đồng ý với Điều khoản sử dụng và Chính sách bảo mật"
              accessibilityState={{ checked: agreeTerms }}
            >
              <MaterialIcons
                name={agreeTerms ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={agreeTerms ? COLORS.primary : COLORS.outline}
              />
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsHighlight}>Điều khoản sử dụng</Text> và{' '}
                <Text style={styles.termsHighlight}>Chính sách bảo mật</Text> của Ký Hiệu Việt
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <ActionButton label="Đăng ký tài khoản" onPress={handleRegister} loading={loading} icon="arrow-forward" />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng ký nhanh</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Alternative Auth Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Google', 'Tính năng đăng ký qua Google đang được tích hợp.')}
                activeOpacity={0.8}
                accessibilityRole="button" accessibilityLabel="Đăng ký bằng Google"
              >
                <MaterialIcons name="g-mobiledata" size={28} color={COLORS.secondaryContainer} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Khách', 'Bạn có thể dùng tính năng Trải nghiệm nhanh ở màn hình Đăng nhập.')}
                activeOpacity={0.8}
                accessibilityRole="button" accessibilityLabel="Dùng thử"
              >
                <MaterialIcons name="bolt" size={22} color={COLORS.tertiary} />
                <Text style={styles.socialButtonText}>Dùng thử</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer: Already have an account */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}
              accessibilityRole="button" accessibilityLabel="Đăng nhập ngay">
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  intro: { marginBottom: SPACING.xxl },
  welcomeHeading: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.onSurface,
  },
  welcomeDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  termsHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    minWidth: 120,
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerLink: { minHeight: 44, justifyContent: 'center' },
});
