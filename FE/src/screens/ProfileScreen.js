import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SURFACES, TYPOGRAPHY, TOUCH_TARGET, CONTENT_MAX_WIDTH } from '../constants/theme';
import { apiGetMe, apiGetDashboard, clearAuth, getCurrentUser } from '../api/apiClient';
import ProgressBar from '../components/ProgressBar';

export default function ProfileScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const tileWidth = width >= 700 ? '32%' : '100%';
  const [profile, setProfile] = useState(getCurrentUser());
  const [courseOverview, setCourseOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const fetchProfile = async () => {
    try {
      const [data, dashboard] = await Promise.all([apiGetMe(), apiGetDashboard()]);
      if (data) {
        setProfile(data);
      }
      setCourseOverview(dashboard?.courseOverview || null);
      setLoadError(null);
    } catch (err) {
      console.warn('Lỗi lấy thông tin cá nhân:', err.message);
      setLoadError(err.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          navigation.replace('Login');
        },
      },
    ]);
  };

  // Map profile fields safely
  const userName = profile?.fullName || '';
  const userEmail = profile?.email || '';
  const userAvatar = profile?.avatarUrl;
  const userRole = profile?.role === 'STUDENT' ? 'Học viên VSL' : (profile?.role || '');
  const userLevel = profile?.level || 1;
  const userXp = profile?.xp || 0;
  const nextXp = userLevel * 500;
  const xpPercent = Math.min(100, Math.round((userXp / nextXp) * 100));
  const streakDays = profile?.streakDays ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => Alert.alert('Cài đặt', 'Cài đặt tài khoản nâng cao.')}
          accessibilityRole="button"
          accessibilityLabel="Cài đặt tài khoản"
        >
          <MaterialIcons name="settings" size={22} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfile();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {!!loadError && <Text style={styles.loadError} accessibilityLiveRegion="polite">{loadError}</Text>}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={36} color={COLORS.primary} />
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarMini}
                onPress={() => Alert.alert('Ảnh đại diện', 'Đổi ảnh đại diện')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Đổi ảnh đại diện"
              >
                <MaterialIcons name="edit" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userNameText}>{userName}</Text>
              <Text style={styles.userEmailText}>{userEmail}</Text>
              {!!userRole && <Text style={styles.roleText}>{userRole}</Text>}
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpHeaderRow}>
              <Text style={styles.xpLevelTitle}>Cấp độ {userLevel}</Text>
              <Text style={styles.xpFractionText}>
                {userXp.toLocaleString()} / {nextXp.toLocaleString()} XP
              </Text>
            </View>

            <ProgressBar label="Tiến độ điểm XP" progress={xpPercent} />
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Chỉ số rèn luyện</Text>
        </View>

        <View style={styles.bentoGrid}>
          <View style={[styles.bentoTile, { width: tileWidth }]}>
            <Text style={styles.tileBigNumber}>{streakDays} ngày</Text>
            <Text style={styles.tileLabel}>Chuỗi học liên tục</Text>
          </View>

          <View style={[styles.bentoTile, { width: tileWidth }]}>
            <Text style={styles.tileBigNumber}>{courseOverview?.masteredSigns ?? 0} từ</Text>
            <Text style={styles.tileLabel}>Ký hiệu đã thuộc</Text>
          </View>

          <View style={[styles.bentoTile, { width: tileWidth }]}>
            <Text style={styles.tileBigNumber}>{courseOverview?.aiAccuracy ?? 0}%</Text>
            <Text style={styles.tileLabel}>Độ chính xác AI</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Huy hiệu</Text>
        </View>

        <View style={styles.achievementsCol}>
          <Text style={styles.achDesc}>Chưa có huy hiệu nào.</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Cài đặt</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Hỗ trợ rung phản hồi</Text>
              <Text style={styles.settingSub}>Rung xúc giác khi AI nhận diện chính xác</Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              accessibilityLabel="Hỗ trợ rung phản hồi"
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryFixed }}
              thumbColor={hapticFeedback ? COLORS.primary : '#fff'}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Nhắc nhở học tập hàng ngày</Text>
              <Text style={styles.settingSub}>Thông báo vào lúc 20:00 mỗi tối</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              accessibilityLabel="Nhắc nhở học tập hàng ngày"
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryFixed }}
              thumbColor={dailyReminder ? COLORS.primary : '#fff'}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Tải bài học ngoại tuyến</Text>
              <Text style={styles.settingSub}>Lưu video & bài tập để học không cần mạng</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              accessibilityLabel="Tải bài học ngoại tuyến"
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryFixed }}
              thumbColor={offlineMode ? COLORS.primary : '#fff'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.onSurface,
    flex: 1,
  },
  settingsBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  loadError: { ...TYPOGRAPHY.caption, color: COLORS.error, marginBottom: SPACING.sm },
  userCard: {
    ...SURFACES.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
  },
  editAvatarMini: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  userNameText: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
    marginTop: 2,
  },
  userEmailText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  xpCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  xpLevelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  xpFractionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    ...TYPOGRAPHY.section,
    color: COLORS.onSurface,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  bentoTile: {
    ...SURFACES.card,
    padding: SPACING.md,
    gap: 4,
  },
  tileBigNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  tileLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  achievementsCol: {
    ...SURFACES.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  achDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  settingsCard: {
    ...SURFACES.card,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    minHeight: TOUCH_TARGET,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  settingSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginVertical: 8,
  },
  logoutButton: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
});
