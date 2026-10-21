-- ════════════════════════════════════════════════════════════════
-- Migration: Thêm tầng BÀI HỌC (LESSONS) giữa TOPICS và SIGNS
-- Hibernate (ddl-auto=update) tự tạo khi khởi động; script này dùng khi
-- triển khai DB thủ công hoặc khi tắt ddl-auto.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID(N'dbo.LESSONS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LESSONS (
        lesson_id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        topic_id           BIGINT          NOT NULL,
        title              NVARCHAR(200)   NOT NULL,
        description        NVARCHAR(1000)  NULL,
        objectives         NVARCHAR(1000)  NULL,
        video_url          NVARCHAR(500)   NULL,
        video_thumb        NVARCHAR(500)   NULL,
        duration           NVARCHAR(10)    NULL,
        difficulty         INT             NOT NULL DEFAULT 1,
        estimated_minutes  INT             NULL,
        display_order      INT             NULL,
        is_active          BIT             NOT NULL DEFAULT 1,
        created_at         DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
        created_by         NVARCHAR(100)   NULL,
        updated_at         DATETIME2       NULL,
        updated_by         NVARCHAR(100)   NULL,
        CONSTRAINT FK_LESSONS_TOPICS FOREIGN KEY (topic_id) REFERENCES dbo.TOPICS(topic_id)
    );
    CREATE INDEX IX_LESSONS_topic_order ON dbo.LESSONS(topic_id, display_order);
END
GO

IF COL_LENGTH('dbo.SIGNS', 'lesson_id') IS NULL
    ALTER TABLE dbo.SIGNS ADD lesson_id BIGINT NULL
        CONSTRAINT FK_SIGNS_LESSONS REFERENCES dbo.LESSONS(lesson_id);
GO

IF COL_LENGTH('dbo.SIGNS', 'display_order') IS NULL
    ALTER TABLE dbo.SIGNS ADD display_order INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SIGNS_lesson_order')
    CREATE INDEX IX_SIGNS_lesson_order ON dbo.SIGNS(lesson_id, display_order);
GO
