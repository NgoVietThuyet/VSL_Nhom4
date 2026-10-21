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
