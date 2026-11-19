import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPE } from '../constants/theme';
import Header from '../components/Header';
import ActionButton from '../components/ActionButton';

// Camera recognition has no native implementation yet. Keep this route honest and useful.
export default function AICameraScreen({ route, navigation }) {
  const sign = route.params?.sign?.word ? route.params.sign : null;
  const goToTopics = () => navigation.navigate('MainTabs', { screen: 'Topics' });
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <Header title="Luyện ký hiệu" showBack={navigation.canGoBack()} onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.icon}><MaterialIcons name="front-hand" size={40} color={COLORS.primary} /></View>
      <Text style={styles.title}>{sign ? `Luyện ký hiệu “${sign.word}”` : 'Chọn ký hiệu để luyện tập'}</Text>
      {!!sign?.description && <Text style={styles.description}>{sign.description}</Text>}
      <View style={styles.notice} accessibilityRole="alert">
        <MaterialIcons name="info-outline" size={24} color={COLORS.warning} />
        <View style={styles.noticeText}>
          <Text style={styles.noticeTitle}>AI Camera chưa khả dụng</Text>
          <Text style={styles.noticeBody}>Ứng dụng hiện chưa thể mở camera hoặc đánh giá cử chỉ. Bạn có thể xem hướng dẫn và video của ký hiệu để tự luyện tập.</Text>
        </View>
      </View>
      {sign ? <ActionButton label="Xem hướng dẫn ký hiệu" onPress={() => navigation.navigate('SignDetail', { sign })} /> : <ActionButton label="Chọn chủ đề" onPress={goToTopics} />}
      {sign && <ActionButton label="Chọn ký hiệu khác" variant="secondary" onPress={goToTopics} style={styles.secondary} />}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: SPACING.margin, paddingTop: SPACING.xxxl, paddingBottom: SPACING.xxxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  icon: { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl },
  title: { color: COLORS.onSurface, fontSize: TYPE.headline, fontWeight: '800', lineHeight: 34, marginBottom: SPACING.md },
  description: { color: COLORS.onSurfaceVariant, fontSize: TYPE.body, lineHeight: 24, marginBottom: SPACING.xxl },
  notice: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: COLORS.warningContainer, marginBottom: SPACING.xxl },
  noticeText: { flex: 1 },
  noticeTitle: { color: COLORS.onSurface, fontSize: TYPE.body, fontWeight: '700', marginBottom: SPACING.xs },
  noticeBody: { color: COLORS.onSurface, fontSize: TYPE.bodySmall, lineHeight: 21 },
  secondary: { marginTop: SPACING.md },
});
