/**
 * Constants TK refactor 016/018: 3 trạng thái độc lập.
 * - TaskStatus       (10 giá trị) — thực hiện công việc (tổng hợp)
 * - AssignmentStatus (10 giá trị) — per-org: giao việc + đề xuất thực hiện
 * - ProcessingStatus (4 giá trị)  — xử lý văn bản
 */

// ═════════════════════════════════════════════════════════════════════
// Task status (thực hiện công việc) — khớp BE TaskInformationStatus
// ═════════════════════════════════════════════════════════════════════
export const TaskStatusCode = {
  NotStarted: 0,
  InProgress: 1,
  Completed: 2,
  Overdue: 3,
  PendingComplete: 4,
  PendingExtend: 5,
  PendingPause: 6,
  PendingStop: 7,
  Paused: 8,
  Stopped: 9,
} as const;

export type TaskStatusValue = (typeof TaskStatusCode)[keyof typeof TaskStatusCode];

export const TASK_STATUS_LABELS: Record<number, string> = {
  [TaskStatusCode.NotStarted]: 'Chưa thực hiện',
  [TaskStatusCode.InProgress]: 'Đang thực hiện',
  [TaskStatusCode.Completed]: 'Hoàn thành',
  [TaskStatusCode.Overdue]: 'Quá hạn',
  [TaskStatusCode.PendingComplete]: 'Chờ duyệt hoàn thành',
  [TaskStatusCode.PendingExtend]: 'Chờ duyệt gia hạn',
  [TaskStatusCode.PendingPause]: 'Chờ duyệt tạm dừng',
  [TaskStatusCode.PendingStop]: 'Chờ duyệt dừng',
  [TaskStatusCode.Paused]: 'Tạm dừng',
  [TaskStatusCode.Stopped]: 'Đã dừng',
};

export const TASK_STATUS_COLORS: Record<number, string> = {
  [TaskStatusCode.NotStarted]: 'default',
  [TaskStatusCode.InProgress]: 'processing',
  [TaskStatusCode.Completed]: 'success',
  [TaskStatusCode.Overdue]: 'error',
  [TaskStatusCode.PendingComplete]: 'gold',
  [TaskStatusCode.PendingExtend]: 'gold',
  [TaskStatusCode.PendingPause]: 'gold',
  [TaskStatusCode.PendingStop]: 'gold',
  [TaskStatusCode.Paused]: 'warning',
  [TaskStatusCode.Stopped]: 'default',
};

export function isTaskPending(status: number): boolean {
  return (
    status === TaskStatusCode.PendingComplete ||
    status === TaskStatusCode.PendingExtend ||
    status === TaskStatusCode.PendingPause ||
    status === TaskStatusCode.PendingStop
  );
}

export function isTaskTerminal(status: number): boolean {
  return status === TaskStatusCode.Completed || status === TaskStatusCode.Stopped;
}

export function isTaskOpen(status: number): boolean {
  return !isTaskTerminal(status);
}

// ═════════════════════════════════════════════════════════════════════
// Assignment status (per-org) — khớp BE AssignmentStatusCode
// 0-3: trạng thái giao việc; 4-9: trạng thái thực hiện per-org
// ═════════════════════════════════════════════════════════════════════
export const AssignmentStatusCode = {
  NotAssigned:         0,
  AssignedNotAccepted: 1,
  Accepted:            2,  // Tiếp nhận — chưa thực hiện
  Finished:            3,  // Hoàn thành
  PendingComplete:     4,
  PendingExtend:       5,
  PendingPause:        6,
  PendingStop:         7,
  Paused:              8,
  Stopped:             9,
  InProgress:          10, // Bắt đầu thực hiện — đang thực hiện
} as const;

export type AssignmentStatusValue = (typeof AssignmentStatusCode)[keyof typeof AssignmentStatusCode];

export const ASSIGNMENT_STATUS_LABELS: Record<number, string> = {
  [AssignmentStatusCode.NotAssigned]:         'Chưa giao',
  [AssignmentStatusCode.AssignedNotAccepted]: 'Đã giao - Chưa tiếp nhận',
  [AssignmentStatusCode.Accepted]:            'Chưa thực hiện',
  [AssignmentStatusCode.Finished]:            'Hoàn thành',
  [AssignmentStatusCode.PendingComplete]:     'Chờ duyệt hoàn thành',
  [AssignmentStatusCode.PendingExtend]:       'Chờ duyệt gia hạn',
  [AssignmentStatusCode.PendingPause]:        'Chờ duyệt tạm dừng',
  [AssignmentStatusCode.PendingStop]:         'Chờ duyệt dừng',
  [AssignmentStatusCode.Paused]:              'Tạm dừng',
  [AssignmentStatusCode.Stopped]:             'Đã dừng',
  10:                                         'Đang thực hiện',
};

export const ASSIGNMENT_STATUS_COLORS: Record<number, string> = {
  [AssignmentStatusCode.NotAssigned]:         'default',
  [AssignmentStatusCode.AssignedNotAccepted]: 'warning',
  [AssignmentStatusCode.Accepted]:            'default',
  [AssignmentStatusCode.Finished]:            'success',
  [AssignmentStatusCode.PendingComplete]:     'gold',
  [AssignmentStatusCode.PendingExtend]:       'gold',
  [AssignmentStatusCode.PendingPause]:        'gold',
  [AssignmentStatusCode.PendingStop]:         'gold',
  [AssignmentStatusCode.Paused]:              'warning',
  [AssignmentStatusCode.Stopped]:             'default',
  10:                                         'processing',
};

export function isAssignmentPending(status: number): boolean {
  return status >= 4 && status <= 7;
}

export function isAssignmentTerminal(status: number): boolean {
  return status === AssignmentStatusCode.Finished || status === AssignmentStatusCode.Stopped;
}

// ═════════════════════════════════════════════════════════════════════
// Proposal type & status — khớp BE ProposalTypeCode / ProposalStatusCode
// ═════════════════════════════════════════════════════════════════════
export const ProposalTypeCode = {
  Complete: 1,
  Extend:   2,
  Pause:    3,
  Stop:     4,
} as const;

export const PROPOSAL_TYPE_LABELS: Record<number, string> = {
  [ProposalTypeCode.Complete]: 'Đề xuất hoàn thành',
  [ProposalTypeCode.Extend]:   'Đề xuất gia hạn',
  [ProposalTypeCode.Pause]:    'Đề xuất tạm dừng',
  [ProposalTypeCode.Stop]:     'Đề xuất dừng',
};

export const ProposalStatusCode = {
  Pending:  0,
  Approved: 1,
  Rejected: 2,
} as const;

export const PROPOSAL_STATUS_LABELS: Record<number, string> = {
  [ProposalStatusCode.Pending]:  'Chờ phê duyệt',
  [ProposalStatusCode.Approved]: 'Đã phê duyệt',
  [ProposalStatusCode.Rejected]: 'Đã từ chối',
};

export const PROPOSAL_STATUS_COLORS: Record<number, string> = {
  [ProposalStatusCode.Pending]:  'gold',
  [ProposalStatusCode.Approved]: 'success',
  [ProposalStatusCode.Rejected]: 'error',
};

// ═════════════════════════════════════════════════════════════════════
// Document processing status — khớp BE DocumentProcessingStatus
// ═════════════════════════════════════════════════════════════════════
export const DocumentProcessingStatusCode = {
  NotProcessed: 0,       // Chưa xử lý (mới tạo, OCR)
  Processing: 1,          // Đang xử lý (đang giao nhiệm vụ)
  AssignmentCompleted: 2, // Đã hoàn thành giao nhiệm vụ
  Completed: 3,           // Đã hoàn thành (tất cả nhiệm vụ xong)
} as const;

export type DocumentProcessingStatusValue = (typeof DocumentProcessingStatusCode)[keyof typeof DocumentProcessingStatusCode];

export const DOCUMENT_PROCESSING_STATUS_LABELS: Record<number, string> = {
  [DocumentProcessingStatusCode.NotProcessed]: 'Chưa xử lý',
  [DocumentProcessingStatusCode.Processing]: 'Đang xử lý',
  [DocumentProcessingStatusCode.AssignmentCompleted]: 'Hoàn thành giao',
  [DocumentProcessingStatusCode.Completed]: 'Đã hoàn thành',
};

export const DOCUMENT_PROCESSING_STATUS_COLORS: Record<number, string> = {
  [DocumentProcessingStatusCode.NotProcessed]: 'default',
  [DocumentProcessingStatusCode.Processing]: 'processing',
  [DocumentProcessingStatusCode.AssignmentCompleted]: 'cyan',
  [DocumentProcessingStatusCode.Completed]: 'success',
};

// ═════════════════════════════════════════════════════════════════════
// Vai trò giao việc + OCR queue
// ═════════════════════════════════════════════════════════════════════
export const TaskReceiveAssignmentRole = {
  Primary: 1,
  Coordinator: 2,
  Observer: 3,
} as const;

export const DocumentOcrStatus = {
  Pending: 0,
  Processing: 1,
  Success: 2,
  Failed: 3,
} as const;

// ═════════════════════════════════════════════════════════════════════
// Status history (audit)
// ═════════════════════════════════════════════════════════════════════
export const StatusHistoryEntityType = {
  Task: 'TASK',
  Assignment: 'ASSIGNMENT',
  Document: 'DOCUMENT',
} as const;

export const StatusHistoryAction = {
  CreateTask: 'CREATE_TASK',
  MarkInProgress: 'MARK_IN_PROGRESS',
  MarkOverdue: 'MARK_OVERDUE',
  ProposeComplete: 'PROPOSE_COMPLETE',
  ApproveComplete: 'APPROVE_COMPLETE',
  RejectComplete: 'REJECT_COMPLETE',
  ProposeExtend: 'PROPOSE_EXTEND',
  ApproveExtend: 'APPROVE_EXTEND',
  RejectExtend: 'REJECT_EXTEND',
  ProposePause: 'PROPOSE_PAUSE',
  ApprovePause: 'APPROVE_PAUSE',
  RejectPause: 'REJECT_PAUSE',
  Resume: 'RESUME',
  ProposeStop: 'PROPOSE_STOP',
  ApproveStop: 'APPROVE_STOP',
  RejectStop: 'REJECT_STOP',
  Dispatch: 'DISPATCH',
  AcceptAssignment: 'ACCEPT_ASSIGNMENT',
  FinishAssignment: 'FINISH_ASSIGNMENT',
  CancelDispatch: 'CANCEL_DISPATCH',
  RecallDispatch: 'RECALL_DISPATCH',
  DocumentNotProcessed: 'DOC_NOT_PROCESSED',
  DocumentProcessing: 'DOC_PROCESSING',
  DocumentCompleted: 'DOC_COMPLETED',
} as const;

export const STATUS_HISTORY_ACTION_LABELS: Record<string, string> = {
  [StatusHistoryAction.CreateTask]: 'Tạo nhiệm vụ',
  [StatusHistoryAction.MarkInProgress]: 'Tiếp nhận thực hiện',
  [StatusHistoryAction.MarkOverdue]: 'Đánh dấu quá hạn',
  [StatusHistoryAction.ProposeComplete]: 'Đề xuất hoàn thành',
  [StatusHistoryAction.ApproveComplete]: 'Duyệt hoàn thành',
  [StatusHistoryAction.RejectComplete]: 'Từ chối hoàn thành',
  [StatusHistoryAction.ProposeExtend]: 'Đề xuất gia hạn',
  [StatusHistoryAction.ApproveExtend]: 'Duyệt gia hạn',
  [StatusHistoryAction.RejectExtend]: 'Từ chối gia hạn',
  [StatusHistoryAction.ProposePause]: 'Đề xuất tạm dừng',
  [StatusHistoryAction.ApprovePause]: 'Duyệt tạm dừng',
  [StatusHistoryAction.RejectPause]: 'Từ chối tạm dừng',
  [StatusHistoryAction.Resume]: 'Tiếp tục thực hiện',
  [StatusHistoryAction.ProposeStop]: 'Đề xuất dừng',
  [StatusHistoryAction.ApproveStop]: 'Duyệt dừng',
  [StatusHistoryAction.RejectStop]: 'Từ chối dừng',
  [StatusHistoryAction.Dispatch]: 'Giao việc',
  [StatusHistoryAction.AcceptAssignment]: 'Tiếp nhận giao việc',
  [StatusHistoryAction.FinishAssignment]: 'Hoàn thành giao việc',
  [StatusHistoryAction.CancelDispatch]: 'Hủy giao việc',
  [StatusHistoryAction.RecallDispatch]: 'Thu hồi giao việc',
  [StatusHistoryAction.DocumentNotProcessed]: 'Văn bản chưa xử lý',
  [StatusHistoryAction.DocumentProcessing]: 'Văn bản đang xử lý',
  [StatusHistoryAction.DocumentCompleted]: 'Văn bản hoàn thành',
};

// ═════════════════════════════════════════════════════════════════════
// Tab filter keys
// ═════════════════════════════════════════════════════════════════════
export const TaskListTabKey = {
  All: 'all',
  Pending: 'pending',
  InProgress: 'in_progress',
  Overdue: 'overdue',
  Completed: 'completed',
  PendingApproval: 'pending_approval',
  Paused: 'paused',
  Stopped: 'stopped',
} as const;

export const ReceiveListTabKey = {
  NotAccepted: 'not_accepted',
  Accepted: 'accepted',
  InProgress: 'in_progress',
  Overdue: 'overdue',
  Completed: 'completed',
} as const;

export const DocumentListTabKey = {
  NotProcessed: 'not_processed',
  InProgress: 'in_progress',
  Completed: 'completed',
} as const;

// ═════════════════════════════════════════════════════════════════════
// OCR drawer + attachment + theme (giữ nguyên từ phiên bản cũ)
// ═════════════════════════════════════════════════════════════════════
export const OcrStageKey = {
  Idle: 'idle',
  Uploading: 'uploading',
  Ocr: 'ocr',
  Streaming: 'streaming',
  Done: 'done',
  Error: 'error',
} as const;

export type OcrStage = (typeof OcrStageKey)[keyof typeof OcrStageKey];

export const AttachmentFileStatus = {
  Idle: 'idle',
  Uploading: 'uploading',
  Ocr: 'ocr',
  Ready: 'ready',
  Error: 'error',
} as const;

export type AttachmentFileStatusType = (typeof AttachmentFileStatus)[keyof typeof AttachmentFileStatus];

export { readCssSystemPrimary as getTkThemePrimary, readCssSystemPrimaryLight as getTkThemePrimaryLight } from '../../../core/utils/theme-tokens';

/** @deprecated Dùng getTkThemePrimary() — màu từ theme.less (--system-primary). */
export const TK_THEME_PRIMARY = '#189AD6';
/** @deprecated Dùng getTkThemePrimaryLight(). */
export const TK_THEME_PRIMARY_LIGHT = '#40b8e0';
export const TK_LIST_TABLE_SCROLL_Y = 'calc(100vh - 200px)';
export const TK_INTERNAL_TABLE_SCROLL_Y = 'calc(100vh - 290px)';

// ═════════════════════════════════════════════════════════════════════
// Backward-compat aliases (deprecated — sẽ xóa sau khi UI migrate xong)
// ═════════════════════════════════════════════════════════════════════
/** @deprecated Use TaskStatusCode */
export const TaskInformationStatus = TaskStatusCode;
/** @deprecated Use AssignmentStatusCode */
export const TaskReceiveStatus = {
  Pending: AssignmentStatusCode.AssignedNotAccepted,
  Received: AssignmentStatusCode.AssignedNotAccepted,
  InProgress: AssignmentStatusCode.Accepted,
  Completed: AssignmentStatusCode.Finished,
  Rejected: AssignmentStatusCode.AssignedNotAccepted,
} as const;
/** @deprecated Use DocumentProcessingStatusCode */
export const DocumentStatus = {
  Draft: DocumentProcessingStatusCode.NotProcessed,
  Active: DocumentProcessingStatusCode.Processing,
  Expired: DocumentProcessingStatusCode.Completed,
} as const;
/** @deprecated Use DOCUMENT_PROCESSING_STATUS_LABELS */
export const DOCUMENT_STATUS_LABELS = DOCUMENT_PROCESSING_STATUS_LABELS;
/** @deprecated Use DOCUMENT_PROCESSING_STATUS_COLORS */
export const DOCUMENT_STATUS_COLORS = DOCUMENT_PROCESSING_STATUS_COLORS;

export function isTaskInformationOpen(status: number): boolean {
  return isTaskOpen(status);
}

export function isTaskReceiveOpen(status: number): boolean {
  return status !== AssignmentStatusCode.Finished;
}
