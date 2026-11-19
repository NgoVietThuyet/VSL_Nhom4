import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPE, SIZES } from '../constants/theme';
import { apiGetMe, apiGetDashboard, clearAuth, getCurrentUser } from '../api/apiClient';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(getCurrentUser());
  const [overview, setOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fetchProfile = async () => {
    try {
      const [data, dashboard] = await Promise.all([apiGetMe(), apiGetDashboard()]);
      if (data) setProfile(data);
      setOverview(dashboard?.courseOverview || null);
      setError('');
    } catch (err) { setError(err.message || 'Không tải được hồ sơ.'); }
    finally { setRefreshing(false); setLoading(false); }
  };
  useEffect(() => { fetchProfile(); }, []);
  const handleLogout = () => Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: () => { clearAuth(); navigation.replace('Login'); } },
  ]);
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <Header title="Cá nhân" />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={COLORS.primary} />}>
      <View style={styles.person}>
        {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]}><MaterialIcons name="person" size={32} color={COLORS.primary} /></View>}
        <View style={styles.personText}>
          <Text style={styles.name}>{profile?.fullName || 'Học viên'}</Text>
          {!!profile?.email && <Text style={styles.email}>{profile.email}</Text>}
          {!!profile?.role && <Text style={styles.role}>{profile.role === 'STUDENT' ? 'Học viên VSL' : profile.role}</Text>}
        </View>
      </View>
      {!!error && <View style={styles.message}><Text style={styles.error}>{error}</Text><ActionButton label="Thử tải lại" variant="secondary" onPress={fetchProfile} /></View>}
      {loading && <ActivityIndicator color={COLORS.primary} accessibilityLabel="Đang tải hồ sơ" />}
      <Text style={styles.heading}>Tiến độ học</Text>
      {overview ? <View style={styles.stats}>
        {overview.overallProgress != null && <Stat label="Tiến độ khóa học" value={`${overview.overallProgress}%`} />}
        {overview.masteredSigns != null && <Stat label="Ký hiệu đã thuộc" value={`${overview.masteredSigns}`} />}
        {overview.totalSigns != null && <Stat label="Tổng ký hiệu" value={`${overview.totalSigns}`} />}
        {overview.aiAccuracy != null && <Stat label="Độ chính xác AI" value={`${overview.aiAccuracy}%`} />}
      </View> : !loading ? <Text style={styles.empty}>Chưa có dữ liệu tiến độ để hiển thị.</Text> : null}
      {profile?.streakDays != null && <View style={styles.plainRow}><MaterialIcons name="local-fire-department" size={SIZES.icon} color={COLORS.secondary} /><Text style={styles.rowText}>Chuỗi học: {profile.streakDays} ngày</Text></View>}
      {profile?.xp != null && <View style={styles.plainRow}><MaterialIcons name="stars" size={SIZES.icon} color={COLORS.primary} /><Text style={styles.rowText}>Điểm XP: {profile.xp.toLocaleString()}</Text></View>}
      <Pressable accessibilityRole="button" onPress={handleLogout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <MaterialIcons name="logout" size={SIZES.icon} color={COLORS.error} /><Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
function Stat({ label, value }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: SPACING.margin, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxxl },
  person: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, paddingBottom: SPACING.xxl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 64, height: 64, borderRadius: RADIUS.full },
  avatarPlaceholder: { backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  personText: { flex: 1, gap: SPACING.xs },
  name: { color: COLORS.onSurface, fontSize: TYPE.title, fontWeight: '800' },
  email: { color: COLORS.onSurfaceVariant, fontSize: TYPE.bodySmall },
  role: { color: COLORS.primary, fontSize: TYPE.bodySmall, fontWeight: '700' },
  heading: { color: COLORS.onSurface, fontSize: TYPE.titleSmall, fontWeight: '700', marginTop: SPACING.xxxl, marginBottom: SPACING.lg },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  stat: { width: '47%', minHeight: 104, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.lg, justifyContent: 'center' },
  statValue: { color: COLORS.primary, fontSize: TYPE.title, fontWeight: '800' },
  statLabel: { color: COLORS.onSurfaceVariant, fontSize: TYPE.bodySmall, marginTop: SPACING.xs },
  empty: { color: COLORS.onSurfaceVariant, fontSize: TYPE.body, lineHeight: 23 },
  plainRow: { minHeight: SIZES.touch, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md },
  rowText: { color: COLORS.onSurface, fontSize: TYPE.body },
  logout: { minHeight: SIZES.button, borderRadius: RADIUS.md, backgroundColor: COLORS.errorContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xxxl },
  logoutText: { color: COLORS.error, fontSize: TYPE.body, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  message: { padding: SPACING.lg, gap: SPACING.md },
  error: { color: COLORS.error, fontSize: TYPE.bodySmall },
});
