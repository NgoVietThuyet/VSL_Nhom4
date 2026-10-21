-- ════════════════════════════════════════════════════════════════
-- Migration: Bỏ 2 cột Phiên âm IPA và Nghĩa tiếng Anh khỏi SIGNS
-- Code (entity, API, Admin, app) đã không còn dùng 2 cột này.
-- CHẠY THỦ CÔNG khi chắc chắn không cần dữ liệu cũ — thao tác không hoàn tác được.
-- ════════════════════════════════════════════════════════════════

IF COL_LENGTH('dbo.SIGNS', 'ipa') IS NOT NULL
    ALTER TABLE dbo.SIGNS DROP COLUMN ipa;
GO

IF COL_LENGTH('dbo.SIGNS', 'english_name') IS NOT NULL
    ALTER TABLE dbo.SIGNS DROP COLUMN english_name;
GO
