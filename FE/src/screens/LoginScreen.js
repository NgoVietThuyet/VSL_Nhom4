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
import { apiLogin } from '../api/apiClient';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

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
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Đăng Nhập</Text>
          <View style={styles.userIconBadge}>
            <MaterialIcons name="person" size={18} color={COLORS.onPrimary} />
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
                <MaterialIcons name="favorite" size={12} color={COLORS.onSecondaryFixed} />
                <Text style={styles.badgeText}>KÝ HIỆU VIỆT</Text>
              </View>
              <Text style={styles.welcomeHeading}>Chào mừng trở lại!</Text>
            </View>
          </View>
          <Text style={styles.welcomeDesc}>
            Đăng nhập để tiếp tục hành trình kết nối ngôn ngữ ký hiệu Việt Nam (VSL) cùng cộng đồng.
          </Text>

          <View style={styles.infoPill}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="visibility" size={16} color={COLORS.onTertiaryContainer} />
            </View>
            <Text style={styles.infoText}>Giao diện trực quan hoá 100% video và cử chỉ</Text>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.formContainer}>
          {/* Identity input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Email hoặc Số điện thoại <Text style={{ color: COLORS.secondary }}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="vidu@domain.com hoặc 09..."
                placeholderTextColor={COLORS.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
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
                placeholder="Nhập mật khẩu của bạn"
                placeholderTextColor={COLORS.outlineVariant}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={COLORS.outline}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Options Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={rememberMe ? COLORS.primary : COLORS.outline}
              />
              <Text style={styles.rememberText}>Ghi nhớ tôi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Quên mật khẩu', 'Vui lòng kiểm tra email để đặt lại mật khẩu.')}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                <MaterialIcons name="arrow-forward" size={20} color={COLORS.onPrimary} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Alternative Logins */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <MaterialIcons name="fingerprint" size={24} color={COLORS.primary} />
              <Text style={styles.socialButtonText}>Sinh trắc học</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <MaterialIcons name="g-mobiledata" size={28} color={COLORS.secondaryContainer} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Direct Access */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <MaterialIcons name="bolt" size={20} color={COLORS.tertiary} />
            <Text style={styles.demoButtonText}>Trải nghiệm nhanh (Khách)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
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
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSecondaryFixed,
  },
  welcomeHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  welcomeDesc: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.onSurface,
    flex: 1,
  },
  formContainer: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  eyeButton: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loginButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.xs,
    ...SHADOWS.md,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.outline,
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  demoButton: {
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
