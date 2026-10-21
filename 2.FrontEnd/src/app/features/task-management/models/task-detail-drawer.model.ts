export interface TaskDiscussAttachment {
  fileId: string;
  fileName?: string;
  icon?: string;
  fileSize?: number;
}

export interface TaskDiscussItem {
  id: string;
  taskId?: string;
  discussType?: number;
  content?: string;
  mentionIdList?: string[];
  attachments?: TaskDiscussAttachment[];
  fullName?: string;
  createBy?: string;
  avatarFileId?: string;
  createDate?: string;
}

export interface TaskHistoryItem {
  id: string;
  fullName?: string;
  action?: string;
  actionLabel?: string;
  description?: string;
  createDate?: string;
  newDeadline?: string;
}

export interface TaskFileItem {
  id: string;
  fileName: string;
  isOriginal?: boolean;
  fileSize?: number;
  createDate?: string;
  icon?: string;
  createBy?: string;
}

export const TASK_DISCUSS_TYPE = {
  COMMENT: 0,
  DIRECTIVE: 1,
} as const;
