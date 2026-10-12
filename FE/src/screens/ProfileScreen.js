import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { USER_PROFILE, ACHIEVEMENTS } from '../data/mockData';

export default function ProfileScreen({ navigation }) {
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => navigation.replace('Login'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ Sơ & Thành Tích</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => Alert.alert('Cài đặt', 'Cài đặt tài khoản nâng cao.')}
        >
          <MaterialIcons name="settings" size={22} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: USER_PROFILE.avatarUrl }} style={styles.avatarImg} />
              <TouchableOpacity
                style={styles.editAvatarMini}
                onPress={() => Alert.alert('Ảnh đại diện', 'Đổi ảnh đại diện')}
              >
                <MaterialIcons name="edit" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                <Text style={styles.roleText}>{USER_PROFILE.role}</Text>
              </View>
              <Text style={styles.userNameText}>{USER_PROFILE.name}</Text>
              <Text style={styles.userEmailText}>{USER_PROFILE.email}</Text>
            </View>
          </View>

          {/* Gamified Level & XP Progress Track */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="military-tech" size={18} color={COLORS.secondaryContainer} />
                <Text style={styles.xpLevelTitle}>
                  Cấp độ {USER_PROFILE.level}: {USER_PROFILE.levelTitle}
                </Text>
              </View>
              <Text style={styles.xpFractionText}>
                {USER_PROFILE.xp.toLocaleString()} / {USER_PROFILE.nextLevelXp.toLocaleString()} XP
              </Text>
            </View>

            <View style={styles.xpTrack}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${(USER_PROFILE.xp / USER_PROFILE.nextLevelXp) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.xpFooterRow}>
              <Text style={styles.xpNextLevelText}>
                Chỉ còn {USER_PROFILE.nextLevelXp - USER_PROFILE.xp} XP để đạt Cấp 4
              </Text>
              <Text style={styles.xpRankText}>{USER_PROFILE.rank}</Text>
            </View>
          </View>
        </View>

        {/* Learning Stats Bento Grid (4 Tiles) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Chỉ số rèn luyện</Text>
          <Text style={styles.updatedTodayText}>Cập nhật hôm nay</Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Tile 1: Streak */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconCircle, { backgroundColor: COLORS.secondaryFixed }]}>
              <MaterialIcons name="local-fire-department" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.tileBigNumber}>{USER_PROFILE.streakDays} ngày</Text>
            <Text style={styles.tileLabel}>Chuỗi học liên tục</Text>
            <Text style={[styles.tileSubNote, { color: COLORS.secondary }]}>
              Kỷ lục: {USER_PROFILE.recordStreak} ngày
            </Text>
          </View>

          {/* Tile 2: Mastered Signs */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconCircle, { backgroundColor: COLORS.primaryFixed }]}>
              <MaterialIcons name="front-hand" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.tileBigNumber}>{USER_PROFILE.masteredSigns} từ</Text>
            <Text style={styles.tileLabel}>Ký hiệu đã thuộc</Text>
            <Text style={[styles.tileSubNote, { color: COLORS.primary }]}>+8 từ tuần này</Text>
          </View>

          {/* Tile 3: AI Accuracy */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconCircle, { backgroundColor: COLORS.tertiaryFixed }]}>
              <MaterialIcons name="neurology" size={22} color={COLORS.tertiary} />
            </View>
            <Text style={styles.tileBigNumber}>{USER_PROFILE.aiAccuracy}%</Text>
            <Text style={styles.tileLabel}>Độ chuẩn AI khớp</Text>
            <Text style={[styles.tileSubNote, { color: COLORS.tertiary }]}>Camera cực tốt</Text>
          </View>

          {/* Tile 4: Total XP */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconCircle, { backgroundColor: COLORS.surfaceContainerHigh }]}>
              <MaterialIcons name="military-tech" size={22} color={COLORS.secondaryContainer} />
            </View>
            <Text style={styles.tileBigNumber}>{USER_PROFILE.xp.toLocaleString()}</Text>
            <Text style={styles.tileLabel}>Tổng điểm XP</Text>
            <Text style={[styles.tileSubNote, { color: COLORS.secondaryContainer }]}>Hạng Bạc</Text>
          </View>
        </View>

        {/* Achievements / Badges */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Huy hiệu & Cột mốc</Text>
          <Text style={styles.updatedTodayText}>3 / 4 Đã mở</Text>
        </View>

        <View style={styles.achievementsCol}>
          {ACHIEVEMENTS.map((ach) => (
            <View
              key={ach.id}
              style={[styles.achCard, !ach.unlocked && { opacity: 0.65 }]}
            >
              <View
                style={[
                  styles.achIconWrap,
                  {
                    backgroundColor: ach.unlocked
                      ? COLORS.primaryFixed
                      : COLORS.surfaceContainerHigh,
                  },
                ]}
              >
                <MaterialIcons
                  name={ach.icon}
                  size={24}
                  color={ach.unlocked ? COLORS.primary : COLORS.outline}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.achTitle}>{ach.title}</Text>
                <Text style={styles.achDesc}>{ach.desc}</Text>
              </View>
              {ach.unlocked ? (
                <View style={styles.achUnlockedPill}>
                  <MaterialIcons name="check" size={14} color={COLORS.tertiary} />
                  <Text style={styles.achUnlockedDate}>{ach.date}</Text>
                </View>
              ) : (
                <Text style={styles.achProgressText}>{ach.progress}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Preferences & Settings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Cài đặt tiện ích</Text>
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
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryFixed }}
              thumbColor={offlineMode ? COLORS.primary : '#fff'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderWidth: 2,
    borderColor: COLORS.primaryFixed,
  },
  editAvatarMini: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  userEmailText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  xpCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLevelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  xpFractionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  xpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpNextLevelText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  xpRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  updatedTodayText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  bentoTile: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: 4,
    ...SHADOWS.sm,
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileBigNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  tileLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  tileSubNote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  achievementsCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  achCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  achIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  achDesc: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  achUnlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  achUnlockedDate: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onTertiaryFixed,
  },
  achProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.outline,
  },
  settingsCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
    fontSize: 11,
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
