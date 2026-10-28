// Chuyển SignResponse từ Backend sang dạng dữ liệu mà các màn hình sử dụng
export function mapSign(s) {
  let steps = [];
  try {
    if (s.stepsJson) steps = JSON.parse(s.stepsJson);
  } catch (e) {
    steps = [];
  }

  return {
    id: s.signId,
    signId: s.signId,
    topicId: s.topicId,
    topicName: s.topicName || '',
    word: s.nameVi || '',
    duration: s.duration || '',
    videoThumb: s.videoThumb,
    videoUrl: s.videoUrl,
    description: s.description || '',
    type: s.contentType || '',
    steps: Array.isArray(steps) ? steps : [],
    culturalNote: s.culturalNote || '',
  };
}

// Chuyển dữ liệu bài học từ Backend sang dạng dữ liệu mà các màn hình sử dụng
export function mapLesson(l) {
  return {
    id: l.lessonId,
    lessonId: l.lessonId,
    topicId: l.topicId,
    topicName: l.topicName || '',
    title: l.title || '',
    description: l.description || '',
    objectives: l.objectives || '',
    videoUrl: l.videoUrl,
    videoThumb: l.videoThumb,
    duration: l.duration || '',
    difficulty: l.difficulty ?? 1,
    estimatedMinutes: l.estimatedMinutes,
    signsCount: l.signsCount ?? (Array.isArray(l.signs) ? l.signs.length : 0),
    masteredCount: l.masteredCount,
    progress: l.progress,
    // Chi tiết bài học: mỗi phần tử gồm { sign, status, masteryScore }
    signs: Array.isArray(l.signs)
      ? l.signs.map((item) => ({ ...mapSign(item.sign), status: item.status || 'unlearned' }))
      : [],
  };
}
