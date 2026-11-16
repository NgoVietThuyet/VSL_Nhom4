import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CONTROL_SIZE,
  LEARNER_THEME,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';
import { apiLogin } from '../api/apiClient';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      await apiLogin(identifier.trim(), password);
      // Chuyển hướng sang màn hình Trang chủ (MainTabs)
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentColumn}>
            {/* Header App Bar */}
            <View style={styles.topBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.neutralPressed,
                ]}
                onPress={() => navigation.canGoBack() && navigation.goBack()}
                android_ripple={{ color: LEARNER_THEME.neutralRipple, borderless: true }}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={LEARNER_THEME.textPrimary}
                  accessible={false}
                />
              </Pressable>

              <Text style={styles.topTitle} accessibilityRole="header">
                Ký Hiệu Việt
              </Text>

              <View
                style={styles.userIconBadge}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialIcons name="person" size={20} color={LEARNER_THEME.primary} />
              </View>
            </View>

            {/* Welcome Card Banner */}
            <View style={styles.welcomeCard}>
              <View style={styles.cardHeader}>
                <View
                  style={styles.iconCircle}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <MaterialIcons
                    name="sign-language"
                    size={32}
                    color={LEARNER_THEME.onPrimary}
                  />
                </View>

                <View style={styles.welcomeCopy}>
                  <Text style={styles.welcomeHeading} accessibilityRole="header">
                    Chào mừng trở lại!
                  </Text>
                </View>
              </View>
            </View>

            {/* Input Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Đăng nhập</Text>

              {/* Identity input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Email hoặc Số điện thoại <Text style={styles.requiredMark}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'identifier' && styles.inputWrapperFocused,
                  ]}
                >
                  <MaterialIcons
                    name="mail-outline"
                    size={20}
                    color={
                      focusedField === 'identifier'
                        ? LEARNER_THEME.primary
                        : LEARNER_THEME.textMuted
                    }
                    style={styles.inputIcon}
                    accessible={false}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={identifier}
                    onChangeText={setIdentifier}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="vidu@domain.com hoặc 09..."
                    placeholderTextColor={LEARNER_THEME.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Email hoặc số điện thoại"
                  />
                </View>
              </View>

              {/* Password input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Mật khẩu <Text style={styles.requiredMark}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={
                      focusedField === 'password'
                        ? LEARNER_THEME.primary
                        : LEARNER_THEME.textMuted
                    }
                    style={styles.inputIcon}
                    accessible={false}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={LEARNER_THEME.textMuted}
                    secureTextEntry={!showPassword}
                    accessibilityLabel="Mật khẩu"
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.eyeButton,
                      pressed && styles.neutralPressed,
                    ]}
                    onPress={() => setShowPassword(!showPassword)}
                    android_ripple={{ color: LEARNER_THEME.neutralRipple, borderless: true }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    accessibilityState={{ expanded: showPassword }}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={LEARNER_THEME.textSecondary}
                      accessible={false}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Options Row */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.rememberRow,
                    pressed && styles.textPressed,
                  ]}
                  onPress={() => setRememberMe(!rememberMe)}
                  accessibilityRole="checkbox"
                  accessibilityLabel="Ghi nhớ tôi"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <MaterialIcons
                    name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={rememberMe ? LEARNER_THEME.primary : LEARNER_THEME.textMuted}
                    accessible={false}
                  />
                  <Text style={styles.rememberText}>Ghi nhớ tôi</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.forgotButton,
                    pressed && styles.textPressed,
                  ]}
                  onPress={() => Alert.alert('Quên mật khẩu', 'Vui lòng kiểm tra email để đặt lại mật khẩu.')}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </Pressable>
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !loading && styles.loginButtonPressed,
                  loading && styles.loginButtonLoading,
                ]}
                onPress={handleLogin}
                disabled={loading}
                android_ripple={{ color: LEARNER_THEME.primaryRipple }}
                accessibilityRole="button"
                accessibilityLabel="Đăng nhập"
                accessibilityState={{ disabled: loading, busy: loading }}
              >
                {loading ? (
                  <ActivityIndicator color={LEARNER_THEME.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color={LEARNER_THEME.onPrimary}
                      accessible={false}
                    />
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Alternative Logins */}
              <View style={styles.socialRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.outlineButtonPressed,
                  ]}
                  onPress={handleLogin}
                  android_ripple={{ color: LEARNER_THEME.neutralRipple }}
                  accessibilityRole="button"
                  accessibilityLabel="Đăng nhập bằng sinh trắc học"
                >
                  <MaterialIcons
                    name="fingerprint"
                    size={24}
                    color={LEARNER_THEME.primary}
                    accessible={false}
                  />
                  <Text style={styles.socialButtonText}>Sinh trắc học</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.outlineButtonPressed,
                  ]}
                  onPress={handleLogin}
                  android_ripple={{ color: LEARNER_THEME.neutralRipple }}
                  accessibilityRole="button"
                  accessibilityLabel="Đăng nhập bằng Google"
                >
                  <MaterialIcons
                    name="g-mobiledata"
                    size={28}
                    color={LEARNER_THEME.secondary}
                    accessible={false}
                  />
                  <Text style={styles.socialButtonText}>Google</Text>
                </Pressable>
              </View>

              {/* Demo Direct Access */}
              <Pressable
                style={({ pressed }) => [
                  styles.demoButton,
                  pressed && styles.outlineButtonPressed,
                ]}
                onPress={handleLogin}
                android_ripple={{ color: LEARNER_THEME.neutralRipple }}
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="bolt"
                  size={20}
                  color={LEARNER_THEME.success}
                  accessible={false}
                />
                <Text style={styles.demoButtonText}>Trải nghiệm nhanh (Khách)</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && styles.textPressed,
                ]}
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
              >
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LEARNER_THEME.background,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },
  contentColumn: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: CONTROL_SIZE.touchTarget,
    height: CONTROL_SIZE.touchTarget,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LEARNER_THEME.surfaceSubtle,
    overflow: 'hidden',
  },
  topTitle: {
    ...TYPOGRAPHY.componentTitle,
    color: LEARNER_THEME.textPrimary,
  },
  userIconBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: LEARNER_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  welcomeCard: {
    backgroundColor: LEARNER_THEME.primarySoft,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: LEARNER_THEME.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: LEARNER_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCopy: {
    flex: 1,
    minWidth: 0,
  },
  welcomeHeading: {
    ...TYPOGRAPHY.screenTitle,
    color: LEARNER_THEME.textPrimary,
  },
  formCard: {
    backgroundColor: LEARNER_THEME.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: LEARNER_THEME.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  formTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: LEARNER_THEME.textPrimary,
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    color: LEARNER_THEME.textPrimary,
  },
  requiredMark: {
    color: LEARNER_THEME.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LEARNER_THEME.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: LEARNER_THEME.border,
    paddingLeft: SPACING.md,
    height: CONTROL_SIZE.input,
  },
  inputWrapperFocused: {
    borderWidth: 2,
    borderColor: LEARNER_THEME.focusRing,
    paddingLeft: SPACING.md - 1,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    alignSelf: 'stretch',
    fontSize: TYPOGRAPHY.bodyLarge.fontSize,
    fontWeight: TYPOGRAPHY.bodyLarge.fontWeight,
    color: LEARNER_THEME.textPrimary,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: true,
  },
  eyeButton: {
    width: CONTROL_SIZE.touchTarget,
    height: CONTROL_SIZE.touchTarget,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
    overflow: 'hidden',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rememberRow: {
    minHeight: CONTROL_SIZE.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rememberText: {
    ...TYPOGRAPHY.label,
    color: LEARNER_THEME.textSecondary,
  },
  forgotButton: {
    minHeight: CONTROL_SIZE.touchTarget,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  forgotText: {
    ...TYPOGRAPHY.label,
    color: LEARNER_THEME.primary,
  },
  loginButton: {
    height: CONTROL_SIZE.primaryButton,
    backgroundColor: LEARNER_THEME.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  loginButtonPressed: {
    backgroundColor: LEARNER_THEME.primaryPressed,
  },
  loginButtonLoading: {
    opacity: 0.72,
  },
  loginButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    color: LEARNER_THEME.onPrimary,
    letterSpacing: 0.4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: LEARNER_THEME.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: LEARNER_THEME.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialButton: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: LEARNER_THEME.surface,
    borderWidth: 1,
    borderColor: LEARNER_THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  socialButtonText: {
    ...TYPOGRAPHY.label,
    color: LEARNER_THEME.textPrimary,
    flexShrink: 1,
  },
  demoButton: {
    minHeight: CONTROL_SIZE.touchTarget,
    borderRadius: RADIUS.md,
    backgroundColor: LEARNER_THEME.surfaceSubtle,
    borderWidth: 1,
    borderColor: LEARNER_THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  demoButtonText: {
    ...TYPOGRAPHY.label,
    color: LEARNER_THEME.success,
  },
  footer: {
    minHeight: CONTROL_SIZE.touchTarget,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: LEARNER_THEME.textSecondary,
  },
  registerButton: {
    minHeight: CONTROL_SIZE.touchTarget,
    justifyContent: 'center',
  },
  registerLink: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: LEARNER_THEME.primary,
  },
  neutralPressed: {
    backgroundColor: LEARNER_THEME.surfaceRaised,
  },
  outlineButtonPressed: {
    backgroundColor: LEARNER_THEME.surfaceRaised,
    borderColor: LEARNER_THEME.focusRing,
  },
  textPressed: {
    opacity: 0.62,
  },
});
