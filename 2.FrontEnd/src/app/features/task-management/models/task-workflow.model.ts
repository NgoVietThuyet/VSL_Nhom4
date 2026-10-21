import { BaseFilter } from '../../../shared/models';

// ══════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ══════════════════════════════════════════════════════════════════

export class TaskProposalDto {
  taskId: string = '';
  note: string = '';
  newDueDate: string | null = null;
  /** Danh sách CmFile.Id đính kèm — tuỳ chọn. */
  attachmentFileIds: string[] = [];
}

export class TaskApprovalDto {
  taskId: string = '';
  /** ReceiveId của đơn vị đã gửi đề xuất. */
  receiveId: string = '';
  note: string = '';
  /** Danh sách CmFile.Id đính kèm — tuỳ chọn. */
  attachmentFileIds: string[] = [];
}

/** Phê duyệt gia hạn — 2 sub-type. */
export class TaskApproveExtendDto extends TaskApprovalDto {
  useProposedDate: boolean = true;
  adjustedDueDate: string | null = null;
  adjustReason: string = '';
}

export class ProposalFilterDto extends BaseFilter {
  proposalType?: number;
}

// ══════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ══════════════════════════════════════════════════════════════════

export interface ProposalAttachmentDto {
  fileId: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  icon?: string;
}

/** 1 row = 1 đề xuất của 1 đơn vị. */
export interface TaskPendingProposalDto {
  id: string;
  taskId: string;
  receiveId: string;
  proposalType: number;
  proposalStatus: number;
  note?: string;
  newDueDate?: string;
  proposedByUserName?: string;
  proposedAt?: string;
  attachmentFileIds?: string;
  attachments?: ProposalAttachmentDto[];

  proposingOrgId: string;
  reviewingOrgId: string;
  proposingOrgName?: string;
  reviewingOrgName?: string;

  taskTitle?: string;
  taskDescription?: string;
  taskCode?: string;
  taskDueDate?: string;
  documentNumber?: string;
  documentSymbol?: string;

  reviewNote?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  reviewAttachmentFileIds?: string;
  reviewAttachments?: ProposalAttachmentDto[];
  useProposedDate?: boolean;
  adjustedDueDate?: string;
  adjustReason?: string;

  proposalTypeLabel?: string;
  proposalStatusLabel?: string;
}

// ══════════════════════════════════════════════════════════════════
// HISTORY (giữ nguyên)
// ══════════════════════════════════════════════════════════════════

export class StatusHistoryDto {
  id: string = '';
  entityType: string = '';
  entityId: string = '';
  oldStatus: number | null = null;
  newStatus: number | null = null;
  action: string = '';
  note: string = '';
  newDeadline: string | null = null;
  actorUserId: string = '';
  taskId: string = '';
  documentId: string = '';
  createDate: string | null = null;
}

// ══════════════════════════════════════════════════════════════════
// BACKWARD-COMPAT
// ══════════════════════════════════════════════════════════════════

/** @deprecated Dùng ProposalFilterDto */
export class PendingApprovalFilterDto extends BaseFilter {
  filterTaskStatus?: number;
}
