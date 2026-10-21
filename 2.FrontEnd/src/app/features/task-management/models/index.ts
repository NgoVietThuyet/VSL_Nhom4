export { TaskDocumentDto, DOCUMENT_LIST_TABS, CREATE_LIST_TABS } from './task-document.model';
export type { DocumentListTab } from './task-document.model';
export type { ExtractedTask, ExtractedDoc } from './task-document-drawer.model';
export type { OcrStage, AttachmentFileStatusType } from './tk.constants';
export {
  // New (3 trạng thái độc lập)
  TaskStatusCode,
  AssignmentStatusCode,
  DocumentProcessingStatusCode,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  DOCUMENT_PROCESSING_STATUS_LABELS,
  DOCUMENT_PROCESSING_STATUS_COLORS,
  StatusHistoryEntityType,
  StatusHistoryAction,
  STATUS_HISTORY_ACTION_LABELS,
  isTaskPending,
  isTaskOpen,
  isTaskTerminal,
  // Legacy aliases (deprecated)
  TaskInformationStatus,
  TaskReceiveStatus,
  TaskReceiveAssignmentRole,
  DocumentStatus,
  DocumentOcrStatus,
  DocumentListTabKey,
  TaskListTabKey,
  ReceiveListTabKey,
  OcrStageKey,
  AttachmentFileStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  TK_THEME_PRIMARY,
  TK_THEME_PRIMARY_LIGHT,
  getTkThemePrimary,
  getTkThemePrimaryLight,
  TK_LIST_TABLE_SCROLL_Y,
  TK_INTERNAL_TABLE_SCROLL_Y,
  isTaskInformationOpen,
  isTaskReceiveOpen,
} from './tk.constants';
export { emptyExtractedDoc, emptyExtractedTask, mergeExtractedTask, mapExtractedTaskToInformationDto } from './task-document-drawer.model';
export { TaskInformationDto, TASK_LIST_TABS, PRIORITY_LABELS, PRIORITY_COLORS, priorityFallbackColor } from './task-information.model';
export type { TaskListTab } from './task-information.model';
export { TaskDispatchDto, DispatchRequestDto, DispatchTargetDto, GiaoTiepRequestDto, ASSIGNMENT_ROLE_LABELS, ASSIGNMENT_ROLE_COLORS } from './task-dispatch.model';
export { TaskReceiveDto, UpdateProgressDto, RECEIVE_LIST_TABS } from './task-receive.model';
export type { ReceiveListTab } from './task-receive.model';
export {
  TaskDashboardDto,
  TaskStatusSummaryDto,
  AssignmentStatusSummaryDto,
  DocumentStatusSummaryDto,
  TaskByStatusDto,
  TaskByOrgDto,
  TaskByFieldDto,
  TaskByMonthDto,
  DashboardFilterDto,
  TaskTreeNodeDto,
  BecomeDueBucketsDto,
  OverdueBucketsDto,
} from './task-dashboard.model';
export {
  TaskProposalDto, TaskApprovalDto, TaskApproveExtendDto,
  StatusHistoryDto, PendingApprovalFilterDto, ProposalFilterDto,
} from './task-workflow.model';
export type { TaskPendingProposalDto, ProposalAttachmentDto } from './task-workflow.model';
export {
  ProposalTypeCode, ProposalStatusCode,
  PROPOSAL_TYPE_LABELS, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS,
  isAssignmentPending, isAssignmentTerminal,
} from './tk.constants';
