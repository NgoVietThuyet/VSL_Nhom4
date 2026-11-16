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
import { apiLogin } from '../api/apiClient';
import FormField from '../components/FormField';
import ActionButton from '../components/ActionButton';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Quay lại">
              <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          )}
          <Text style={styles.topTitle}>Ký Hiệu Việt</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.welcomeHeading}>Đăng nhập</Text>
          <Text style={styles.welcomeDesc}>Tiếp tục học ngôn ngữ ký hiệu Việt Nam.</Text>
        </View>

        {/* Input Form */}
        <View>
          {/* Identity input */}
          <FormField
            label="Email hoặc Số điện thoại"
            icon="mail-outline"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="vidu@domain.com hoặc 09..."
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password input */}
          <FormField
            label="Mật khẩu"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập mật khẩu của bạn"
            secure
          />

          {/* Options Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityLabel="Ghi nhớ tôi"
              accessibilityState={{ checked: rememberMe }}
            >
              <MaterialIcons
                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={rememberMe ? COLORS.primary : COLORS.outline}
              />
              <Text style={styles.rememberText}>Ghi nhớ tôi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => Alert.alert('Quên mật khẩu', 'Vui lòng kiểm tra email để đặt lại mật khẩu.')}
              accessibilityRole="button" accessibilityLabel="Quên mật khẩu"
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <ActionButton label="Đăng nhập" onPress={handleLogin} loading={loading} icon="arrow-forward" />

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
              accessibilityRole="button" accessibilityLabel="Đăng nhập bằng sinh trắc học"
            >
              <MaterialIcons name="fingerprint" size={24} color={COLORS.primary} />
              <Text style={styles.socialButtonText}>Sinh trắc học</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Đăng nhập bằng Google"
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
            accessibilityRole="button" accessibilityLabel="Trải nghiệm nhanh với tư cách khách"
          >
            <MaterialIcons name="bolt" size={20} color={COLORS.tertiary} />
            <Text style={styles.demoButtonText}>Trải nghiệm nhanh (Khách)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}
            accessibilityRole="button" accessibilityLabel="Đăng ký ngay">
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginVertical: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  rememberText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  forgotButton: { minHeight: 44, justifyContent: 'center' },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    minWidth: 120,
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
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
  demoButton: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
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
  footerLink: { minHeight: 44, justifyContent: 'center' },
});
