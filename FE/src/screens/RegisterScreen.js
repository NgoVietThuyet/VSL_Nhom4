import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { apiRegister } from '../api/apiClient';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.surface }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header App Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Tạo Tài Khoản</Text>
            <View style={styles.userIconBadge}>
              <MaterialIcons name="person-add" size={18} color={COLORS.onPrimary} />
            </View>
          </View>

          {/* Welcome Card Banner */}
          <View style={styles.welcomeCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="sign-language" size={32} color={COLORS.onPrimaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <MaterialIcons name="star" size={12} color={COLORS.onSecondaryFixed} />
                  <Text style={styles.badgeText}>THÀNH VIÊN MỚI</Text>
                </View>
                <Text style={styles.welcomeHeading}>Gia nhập Ký Hiệu Việt</Text>
              </View>
            </View>
            <Text style={styles.welcomeDesc}>
              Đăng ký tài khoản miễn phí để học ngôn ngữ ký hiệu Việt Nam (VSL), luyện tập cùng AI và kết nối cộng đồng.
            </Text>

            <View style={styles.infoPill}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="verified" size={16} color={COLORS.onTertiaryContainer} />
              </View>
              <Text style={styles.infoText}>Miễn phí 100% khoá học cử chỉ & luyện AI</Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Full Name input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Họ và tên <Text style={{ color: COLORS.secondary }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor={COLORS.outlineVariant}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Địa chỉ Email <Text style={{ color: COLORS.secondary }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vidu@domain.com"
                  placeholderTextColor={COLORS.outlineVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone input (optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Số điện thoại <Text style={styles.optionalText}>(Không bắt buộc)</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="phone-iphone" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0912 345 678"
                  placeholderTextColor={COLORS.outlineVariant}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Mật khẩu <Text style={{ color: COLORS.secondary }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Tối thiểu 6 ký tự"
                  placeholderTextColor={COLORS.outlineVariant}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={COLORS.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Xác nhận mật khẩu <Text style={{ color: COLORS.secondary }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-clock" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu ở trên"
                  placeholderTextColor={COLORS.outlineVariant}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={COLORS.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Agreement Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
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
            <TouchableOpacity
              style={[styles.registerButton, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>ĐĂNG KÝ TÀI KHOẢN</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={COLORS.onPrimary} />
                </>
              )}
            </TouchableOpacity>

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
              >
                <MaterialIcons name="g-mobiledata" size={28} color={COLORS.secondaryContainer} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Khách', 'Bạn có thể dùng tính năng Trải nghiệm nhanh ở màn hình Đăng nhập.')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="bolt" size={22} color={COLORS.tertiary} />
                <Text style={styles.socialButtonText}>Dùng thử</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer: Already have an account */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    paddingBottom: 40,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  userIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  welcomeHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onPrimaryContainer,
  },
  welcomeDesc: {
    fontSize: 13,
    color: COLORS.onPrimaryContainer,
    opacity: 0.85,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryContainer,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onTertiaryContainer,
    flex: 1,
  },
  formContainer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.outline,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
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
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  termsHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  registerButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimary,
    letterSpacing: 0.5,
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
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    height: 46,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
});
