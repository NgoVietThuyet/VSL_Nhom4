import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPE, SIZES } from '../constants/theme';
import { apiRegister } from '../api/apiClient';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';
import Header from '../components/Header';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ và tên.';
    if (!email.trim()) next.email = 'Vui lòng nhập địa chỉ email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Địa chỉ email không hợp lệ.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 6) next.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    if (password !== confirmPassword) next.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (!agreeTerms) next.terms = 'Vui lòng đồng ý với điều khoản và chính sách bảo mật.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await apiRegister(fullName.trim(), email.trim().toLowerCase(), password, phone.trim());
      setSuccess(true);
    } catch (err) { setErrors({ form: err.message || 'Không thể tạo tài khoản. Vui lòng thử lại.' }); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <Header title="Tạo tài khoản" showBack onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')} />
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {success ? <View style={styles.success} accessibilityLiveRegion="polite">
          <MaterialIcons name="check-circle" size={48} color={COLORS.success} />
          <Text style={styles.title}>Đăng ký thành công</Text>
          <Text style={styles.intro}>Tài khoản của bạn đã sẵn sàng.</Text>
          <ActionButton label="Bắt đầu học" onPress={() => navigation.replace('MainTabs')} />
        </View> : <>
          <Text style={styles.title}>Bắt đầu học VSL</Text>
          <Text style={styles.intro}>Tạo tài khoản để lưu tiến độ học của bạn.</Text>
          <FormField label="Họ và tên" value={fullName} onChangeText={(v) => { setFullName(v); setErrors({}); }} error={errors.fullName} autoCapitalize="words" />
          <FormField label="Địa chỉ email" value={email} onChangeText={(v) => { setEmail(v); setErrors({}); }} error={errors.email} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
          <FormField label="Số điện thoại" optional value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <FormField label="Mật khẩu" value={password} onChangeText={(v) => { setPassword(v); setErrors({}); }} error={errors.password} secure autoComplete="new-password" />
          <FormField label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setErrors({}); }} error={errors.confirmPassword} secure />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreeTerms }} onPress={() => { setAgreeTerms(!agreeTerms); setErrors({}); }} style={styles.terms}>
            <MaterialIcons name={agreeTerms ? 'check-box' : 'check-box-outline-blank'} size={24} color={COLORS.primary} />
            <Text style={styles.termsText}>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</Text>
          </Pressable>
          {!!errors.terms && <Text style={styles.error}>{errors.terms}</Text>}
          {!!errors.form && <Text style={styles.error} accessibilityLiveRegion="polite">{errors.form}</Text>}
          <ActionButton label="Đăng ký tài khoản" onPress={handleRegister} loading={loading} />
          <View style={styles.footer}><Text style={styles.footerText}>Đã có tài khoản?</Text><ActionButton label="Đăng nhập" variant="secondary" onPress={() => navigation.navigate('Login')} /></View>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: SPACING.margin, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxxl },
  title: { color: COLORS.onSurface, fontSize: TYPE.headline, fontWeight: '800', marginBottom: SPACING.sm },
  intro: { color: COLORS.onSurfaceVariant, fontSize: TYPE.body, lineHeight: 23, marginBottom: SPACING.xxl },
  terms: { minHeight: SIZES.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  termsText: { flex: 1, color: COLORS.onSurface, fontSize: TYPE.bodySmall, lineHeight: 20 },
  error: { color: COLORS.error, fontSize: TYPE.bodySmall, marginBottom: SPACING.md },
  footer: { marginTop: SPACING.xxxl, gap: SPACING.md },
  footerText: { color: COLORS.onSurfaceVariant, textAlign: 'center', fontSize: TYPE.bodySmall },
  success: { flex: 1, justifyContent: 'center', gap: SPACING.lg },
});
