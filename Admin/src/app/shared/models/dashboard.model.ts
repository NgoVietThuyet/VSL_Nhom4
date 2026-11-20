export interface KpiStats {
  /** Chỉ tính tài khoản học viên (không gồm quản trị viên). */
  totalStudents: number;
  /** Học viên có hoạt động học trong hôm nay. */
  activeToday: number;
  /** Học viên đang giữ chuỗi ngày học (tính từ lịch sử học thật). */
  streakingStudents?: number;
  totalTopics: number;
  totalSigns: number;
  avgMasteryScore: number;
  todayAiPractices: number;
  avgAiConfidence: number;
}

export interface DayActivity {
  date: string;
  practiceCount: number;
  quizCount: number;
}

export interface TopicPracticeCount {
  topicId: number;
  topicName: string;
  emoji: string;
  count: number;
}

export interface LevelDistribution {
  levelName: string;
  userCount: number;
}

export interface ChartData {
  dailyActivities: DayActivity[];
  topicPractices: TopicPracticeCount[];
  levelDistribution: LevelDistribution[];
}

export interface RecentActivityItem {
  id: string;
  type: 'REGISTER' | 'PRACTICE' | 'QUIZ' | 'MASTERY';
  userName: string;
  userAvatar: string;
  description: string;
  timeAgo: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
}

export interface LeaderboardItem {
  rank: number;
  userId: number;
  userName: string;
  userAvatar: string;
  level: number;
  xp: number;
  streakDays: number;
}

export interface AdminDashboardData {
  kpis: KpiStats;
  charts: ChartData;
  recentActivities: RecentActivityItem[];
  leaderboard: LeaderboardItem[];
}
