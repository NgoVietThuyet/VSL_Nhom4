// Cờ bật/tắt tính năng. Đổi bằng biến môi trường, không cần sửa code:
//   EXPO_PUBLIC_FEATURE_AI_CAMERA=true  -> bật Luyện AI Camera (khi Phase 2 hoàn tất)
const flag = (value) => String(value ?? '').toLowerCase() === 'true';

export const FEATURES = {
  aiCamera: flag(process.env.EXPO_PUBLIC_FEATURE_AI_CAMERA),
};

export const COMING_SOON_LABEL = 'Sắp ra mắt';
