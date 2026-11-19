import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPE } from '../constants/theme';
import { apiLogin } from '../api/apiClient';
import ActionButton from '../components/ActionButton';
import FormField from '../components/FormField';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const next = {};
    if (!identifier.trim()) next.identifier = 'Vui lòng nhập email hoặc số điện thoại.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      setLoading(true);
      await apiLogin(identifier.trim(), password);
      navigation.replace('MainTabs');
    } catch (err) {
      setErrors({ form: err.message || 'Không thể đăng nhập. Vui lòng thử lại.' });
    } finally { setLoading(false); }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><MaterialIcons name="sign-language" size={28} color={COLORS.primary} /><Text style={styles.brandText}>Ký Hiệu Việt</Text></View>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.intro}>Tiếp tục học ngôn ngữ ký hiệu Việt Nam.</Text>
        <FormField label="Email hoặc số điện thoại" value={identifier} onChangeText={(value) => { setIdentifier(value); setErrors({}); }} error={errors.identifier} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        <FormField label="Mật khẩu" value={password} onChangeText={(value) => { setPassword(value); setErrors({}); }} error={errors.password} secure autoComplete="current-password" />
        {!!errors.form && <Text style={styles.error} accessibilityLiveRegion="polite">{errors.form}</Text>}
        <ActionButton label="Đăng nhập" onPress={handleLogin} loading={loading} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <ActionButton label="Đăng ký tài khoản" variant="secondary" onPress={() => navigation.navigate('Register')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: SPACING.margin, paddingTop: SPACING.xxxl, paddingBottom: SPACING.xxxl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xxxl },
  brandText: { color: COLORS.primary, fontSize: TYPE.titleSmall, fontWeight: '800' },
  title: { color: COLORS.onSurface, fontSize: TYPE.headline, fontWeight: '800', marginBottom: SPACING.sm },
  intro: { color: COLORS.onSurfaceVariant, fontSize: TYPE.body, lineHeight: 23, marginBottom: SPACING.xxxl },
  error: { color: COLORS.error, fontSize: TYPE.bodySmall, marginBottom: SPACING.md },
  footer: { marginTop: SPACING.xxxl, gap: SPACING.md },
  footerText: { color: COLORS.onSurfaceVariant, textAlign: 'center', fontSize: TYPE.bodySmall },
});
